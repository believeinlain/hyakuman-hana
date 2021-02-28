import {
    multiply,
    matrix,
    pi,
    cos,
    sin,
    round,
    abs,
    floor,
    cross,
    norm,
    divide,
    subtract,
} from 'mathjs';
import { MeshData } from './flowerData';

const geneMutationParameters = {
    default: {
        // all parameter defaults
        min: 0.0, // minimum possible value
        max: 1.0, // maximum possible value
        lockChance: 0.1, // how likely the gene is to lock if unlocked (0.0, 1.0)
        unlockChance: 0.1, // how likely the gene is to unlock if locked (0.0, 1.0)
        variance: 0.1, // how much the gene is likely to vary on mutation (0.0, 1.0)
        defaultValue: 1.0, // default value for the parameter to start at
    },
    numPetals: {
        // integer number of petals
        min: 1,
        max: 10,
        variance: 0.5,
        defaultValue: 5,
    },
    petalWidth: {
        // petal width
        min: 0.1,
        defaultValue: 0.5,
    },
    petalLength: {
        // petal length
        min: 0.1,
        max: 2.0,
    },
    flowerClosed: {
        // 0 is fully open, 1 is fully closed
        min: -0.5,
        max: 0.8,
        defaultValue: 0.1,
    },
    teardropShape: {
        // 0.5 is round, 1 is teardrop towards tip, 0 is teardrop towards base
        min: 0.1,
        max: 0.9,
        defaultValue: 0.7,
    },
    petalCurl: {
        // petal curl around length
        min: -0.5,
        max: 0.5,
        defaultValue: 0.1,
    },
    petalTipCurl: {
        // how much the petal tip curls inward
        min: -0.05,
        max: 0.05,
        defaultValue: 0.04,
    },
    petalCenterCurl: {
        // how much the petal center curls inward
        min: -0.02,
        max: 0.02,
        defaultValue: -0.01,
    },
    petalSize: {
        // how much to scale all petals (0.0, 1.0)
        max: 2.0,
    },
    firstPetalSize: {
        // how much to scale down only the first petal
        max: 2.0,
    },
    petalHue: {
        defaultValue: 0.0,
    },
    petalSat: {
        defaultValue: 0.8,
    },
    petalVib: {
        defaultValue: 0.9,
    },
    stemLength: {
        // stem length
        min: 1.0,
        max: 3.0,
        defaultValue: 2.5,
    },
    stemThickness: {
        min: 0.04,
        max: 0.06,
        defaultValue: 0.05,
    },
};

class Gene {
    public readonly value: number; // current value of the gene
    public readonly isLocked: boolean; // is the gene currently locked?

    constructor(name: string, value?: number, isLocked?: boolean) {
        // get gene variance parameters
        let mutationParams = geneMutationParameters[name];
        let defaultParams = geneMutationParameters.default;
        let min = mutationParams.min || defaultParams.min;
        let max = mutationParams.max || defaultParams.max;
        let lockChance = mutationParams.lockChance || defaultParams.lockChance;
        let unlockChance =
            mutationParams.unlockChance || defaultParams.unlockChance;

        // if default values are not specified, choose random ones
        if (value === void 0) {
            this.value = Math.random() * (max - min) + min;
        } else {
            this.value = value;
        }
        // whether we start of locked depends on both lockChance and unlockChance
        if (isLocked === void 0) {
            // lock initially based on an even split
            let newIsLocked = Math.random() < 0.5;
            this.isLocked = newIsLocked;
            // then lock or unlock randomly as appropriate
            if (newIsLocked) {
                if (Math.random() < unlockChance) {
                    this.isLocked = false;
                }
            } else {
                if (Math.random() < lockChance) {
                    this.isLocked = true;
                }
            }
        } else {
            this.isLocked = isLocked;
        }
    }

    static mutate(geneData: Gene, name: string): Gene {
        //console.log("Mutated gene", geneData.name);
        // get gene variance parameters
        let mutationParams = geneMutationParameters[name];
        let defaultParams = geneMutationParameters.default;
        let min = mutationParams.min || defaultParams.min;
        let max = mutationParams.max || defaultParams.max;
        let lockChance = mutationParams.lockChance || defaultParams.lockChance;
        let unlockChance =
            mutationParams.unlockChance || defaultParams.unlockChance;
        let variance = mutationParams.variance || defaultParams.variance;

        let newValue = geneData.value;
        // if the gene is unlocked, vary the value
        if (!geneData.isLocked) {
            // get the offset to a random new value
            let offset = Math.random() * (max - min) + min - geneData.value;
            // scale the offset by variance and apply to new value
            newValue = geneData.value + offset * variance;
        }

        // determine of the locked status of this gene will change this mutation
        let newIsLocked = geneData.isLocked;
        if (geneData.isLocked) {
            if (Math.random() < unlockChance) {
                newIsLocked = false;
            }
        } else {
            if (Math.random() < lockChance) {
                newIsLocked = true;
            }
        }

        return new Gene(name, newValue, newIsLocked);
    }

    static copy(geneData: Gene, name: string): Gene {
        return new Gene(name, geneData.value, geneData.isLocked);
    }
}

// interface to access genes by string identifier (sequence may be incomplete)
interface GeneSequence {
    [key: string]: Gene;
}

// used to characterize and mutate variations in flower appearance
export class FlowerGenome implements GeneSequence {
    [k: string]: Gene;

    constructor(genes?: GeneSequence) {
        // initialize genes from geneMutationParameters to ensure a complete sequence
        Object.getOwnPropertyNames(geneMutationParameters).forEach(
            (propName: string) => {
                if (propName != 'default') {
                    if (genes != void 0 && genes.hasOwnProperty(propName)) {
                        // if provided, get the gene from the GeneSequence
                        this[propName] = new Gene(
                            propName,
                            genes[propName].value,
                            genes[propName].isLocked
                        );
                    } else {
                        // else create new gene with default value (maybe randomize instead?)
                        let defaultValue =
                            geneMutationParameters[propName].defaultValue ||
                            geneMutationParameters.default.defaultValue;
                        this[propName] = new Gene(propName, defaultValue);
                    }
                }
            }
        );
    }

    static mutate(genomeData: FlowerGenome): FlowerGenome {
        //console.log("Mutated genome");
        let newGenes: GeneSequence = {};
        // mutate properties of type gene into newGenes
        Object.getOwnPropertyNames(genomeData).forEach((propName: string) => {
            newGenes[propName] = Gene.mutate(genomeData[propName], propName);
        });
        // create a new genome from the mutated genes
        return new FlowerGenome(newGenes);
    }

    static copy(genomeData: FlowerGenome): FlowerGenome {
        let newGenes: GeneSequence = {};
        // copy properties of type gene into newGenes
        Object.getOwnPropertyNames(genomeData).forEach((propName: string) => {
            newGenes[propName] = Gene.copy(genomeData[propName], propName);
        });
        // create a new genome from the mutated genes
        return new FlowerGenome(newGenes);
    }

    static generateMesh(g: FlowerGenome): MeshData {
        // conventions:
        // [x, y, z]
        // z points 'up'
        // no shared vertices since we want flat shading

        // rotation matrices
        function rotate_x(r: number) {
            return matrix([
                [1, 0, 0],
                [0, cos(r), -sin(r)],
                [0, sin(r), cos(r)],
            ]);
        }
        function rotate_y(r: number) {
            return matrix([
                [cos(r), 0, sin(r)],
                [0, 1, 0],
                [-sin(r), 0, cos(r)],
            ]);
        }
        function rotate_z(r: number) {
            return matrix([
                [cos(r), -sin(r), 0],
                [sin(r), cos(r), 0],
                [0, 0, 1],
            ]);
        }
        // scaling matrix
        function scale(x: number, y: number, z: number) {
            return matrix([
                [x, 0, 0],
                [0, y, 0],
                [0, 0, z],
            ]);
        }
        // color converter
        function hsv_to_rgb(h: number, s: number, v: number, a = 1.0) {
            let c = s * v;
            let x = c * (1 - abs(((h * 6.0) % 2) - 1));
            let m = v - c;
            let rgb = [
                [c, x, 0],
                [x, c, 0],
                [0, c, x],
                [0, x, c],
                [x, 0, c],
                [c, 0, x],
            ][floor(h * 5)];
            return rgb.map((k) => k + m).concat(a);
        }

        // lay out the petal vertices
        let teardropScale = g.petalLength.value * g.teardropShape.value;
        let stemLength = g.stemLength.value * 0.2;
        let petalBase = matrix([0, stemLength, 0]);
        let petalCenter = matrix([0, stemLength, teardropScale]);
        let petalTip = matrix([0, stemLength, g.petalLength.value]);
        let petalLeft = matrix([-g.petalWidth.value / 2, stemLength, teardropScale]);
        let petalRight = matrix([g.petalWidth.value / 2, stemLength, teardropScale]);

        // determine the amount of curl for different parts
        let tipAngle = -g.petalTipCurl.value;
        let centerAngle = -g.petalCenterCurl.value;
        let curlAngle = -g.petalCurl.value;

        // rotate the vertices to curl the petal
        petalTip = multiply(rotate_x(tipAngle), petalTip);
        petalCenter = multiply(rotate_x(centerAngle), petalCenter);
        petalLeft = multiply(rotate_z(curlAngle), petalLeft);
        petalRight = multiply(rotate_z(-curlAngle), petalRight);

        // rotate the whole petal inwards
        let closedAngle = pi*-g.flowerClosed.value;
        petalTip = multiply(rotate_x(closedAngle), petalTip);
        petalCenter = multiply(rotate_x(closedAngle), petalCenter);
        petalLeft = multiply(rotate_x(closedAngle), petalLeft);
        petalRight = multiply(rotate_x(closedAngle), petalRight);

        // scale the petal
        let s = g.petalSize.value;
        petalCenter = multiply(scale(s, s, s), petalCenter);
        petalTip = multiply(scale(s, s, s), petalTip);
        petalLeft = multiply(scale(s, s, s), petalLeft);
        petalRight = multiply(scale(s, s, s), petalRight);

        // get angle for each petal
        let numPetals = round(g.numPetals.value);
        let petalAngle = 2*pi / numPetals;

        // define colors for each vert
        let hue = g.petalHue.value;
        let sat = g.petalSat.value;
        let vib = g.petalVib.value;
        let colorBase = hsv_to_rgb(hue, sat, vib);
        let colorCenter = hsv_to_rgb(hue, sat, vib);
        let colorTip = hsv_to_rgb(hue, sat, vib);
        let colorLeft = hsv_to_rgb(hue, sat, vib);
        let colorRight = hsv_to_rgb(hue, sat, vib);

        // define UVs for each vert
        let uvBase = [0.0, 0.0];
        let uvCenter = [0.5, 0.5];
        let uvTip = [1.0, 1.0];
        let uvLeft = [0.0, 1.0];
        let uvRight = [1.0, 0.0];

        function get_normal(v1: number[], v2: number[], v3: number[]) {
            let e1 = subtract(v2, v1) as number[];
            let e2 = subtract(v3, v1) as number[];
            let normal = cross(e1, e2);
            let mag = norm(normal);
            return divide(normal, mag) as number[];
        }

        // clone and rotate all petals
        // 12 = 3 verts/face * 4 faces * 1 index/point
        // 36 = 3 verts/face * 4 faces * 3 floats/point
        // 48 = 3 verts/face * 4 faces * 4 floats/point
        // 24 = 3 verts/face * 4 faces * 2 floats/point
        let ip = 12;
        let vp = 36;
        let cp = 48;
        let up = 24;
        let np = 36;

        let petals = new Array<number>(vp * numPetals);
        let colors = new Array<number>(cp * numPetals);
        let uvs = new Array<number>(up * numPetals);
        let normals = new Array<number>(np * numPetals);
        let face_normal: number[];

        for (let i = 0; i < numPetals; i++) {
            // convert verts to number arrays
            let base = petalBase.toArray() as number[];
            let center = petalCenter.toArray() as number[];
            let right = petalRight.toArray() as number[];
            let left = petalLeft.toArray() as number[];
            let tip = petalTip.toArray() as number[];

            // place verts, colors, and uvs into respective arrays
            petals.splice(0 + i * vp, 3, ...base);
            colors.splice(0 + i * cp, 4, ...colorBase);
            uvs.splice(0 + i * up, 2, ...uvBase);
            petals.splice(3 + i * vp, 3, ...right);
            colors.splice(4 + i * cp, 4, ...colorRight);
            uvs.splice(2 + i * up, 2, ...uvRight);
            petals.splice(6 + i * vp, 3, ...center);
            colors.splice(8 + i * cp, 4, ...colorCenter);
            uvs.splice(4 + i * up, 2, ...uvCenter);
            face_normal = get_normal(base, right, center);
            normals.splice(0 + i * np, 3, ...face_normal);
            normals.splice(3 + i * np, 3, ...face_normal);
            normals.splice(6 + i * np, 3, ...face_normal);

            petals.splice(9 + i * vp, 3, ...right);
            colors.splice(12 + i * cp, 4, ...colorRight);
            uvs.splice(6 + i * up, 2, ...uvRight);
            petals.splice(12 + i * vp, 3, ...tip);
            colors.splice(16 + i * cp, 4, ...colorTip);
            uvs.splice(8 + i * up, 2, ...uvTip);
            petals.splice(15 + i * vp, 3, ...center);
            colors.splice(20 + i * cp, 4, ...colorCenter);
            uvs.splice(10 + i * up, 2, ...uvCenter);
            face_normal = get_normal(right, tip, center);
            normals.splice(9 + i * np, 3, ...face_normal);
            normals.splice(12 + i * np, 3, ...face_normal);
            normals.splice(15 + i * np, 3, ...face_normal);

            petals.splice(18 + i * vp, 3, ...tip);
            colors.splice(24 + i * cp, 4, ...colorTip);
            uvs.splice(12 + i * up, 2, ...uvTip);
            petals.splice(21 + i * vp, 3, ...left);
            colors.splice(28 + i * cp, 4, ...colorLeft);
            uvs.splice(14 + i * up, 2, ...uvLeft);
            petals.splice(24 + i * vp, 3, ...center);
            colors.splice(32 + i * cp, 4, ...colorCenter);
            uvs.splice(16 + i * up, 2, ...uvCenter);
            face_normal = get_normal(tip, left, center);
            normals.splice(18 + i * np, 3, ...face_normal);
            normals.splice(21 + i * np, 3, ...face_normal);
            normals.splice(24 + i * np, 3, ...face_normal);

            petals.splice(27 + i * vp, 3, ...left);
            colors.splice(36 + i * cp, 4, ...colorLeft);
            uvs.splice(18 + i * up, 2, ...uvLeft);
            petals.splice(30 + i * vp, 3, ...base);
            colors.splice(40 + i * cp, 4, ...colorBase);
            uvs.splice(20 + i * up, 2, ...uvBase);
            petals.splice(33 + i * vp, 3, ...center);
            colors.splice(44 + i * cp, 4, ...colorCenter);
            uvs.splice(22 + i * up, 2, ...uvCenter);
            face_normal = get_normal(left, base, center);
            normals.splice(27 + i * np, 3, ...face_normal);
            normals.splice(30 + i * np, 3, ...face_normal);
            normals.splice(33 + i * np, 3, ...face_normal);

            // rotate the next petal
            petalTip = multiply(rotate_y(petalAngle), petalTip);
            petalCenter = multiply(rotate_y(petalAngle), petalCenter);
            petalLeft = multiply(rotate_y(petalAngle), petalLeft);
            petalRight = multiply(rotate_y(petalAngle), petalRight);
        }

        let buffers = {
            positions: Float32Array.from(petals),
            indices: Uint16Array.from(Array(ip*numPetals).keys()),
            colors: Float32Array.from(colors),
            uvs: Float32Array.from(uvs),
            normals: Float32Array.from(normals),
        };
        
        console.log(buffers);

        return buffers;
    }
}
