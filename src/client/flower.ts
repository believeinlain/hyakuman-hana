
import { 
    MeshBuilder,
    Scene,
    Mesh,
    VertexData,
    Vector3,
    Quaternion,
    Space,
    Color3,
    Color4,
    VertexBuffer,
    Vector2,
    Ray
} from "@babylonjs/core";

import { FlowerGenome } from '../common/flowerGenome';
import { FlowerPacket } from '../common/flowerPacket';

import { v4 as uuidv4 } from 'uuid';

class Petal {
    vertices: number[];
    indices: number[];
    colors: number[];
    uvs: number[];
    mesh: Mesh;

    constructor (genome: FlowerGenome, petalNum: number) {
        this.vertices = [0, 0, 0];

        let tip = new Vector3(0, 0, genome.petalLength.value);
        let center = tip.scale(genome.teardropShape.value);
        let rightPoint = tip.scale(genome.teardropShape.value)
            .add(new Vector3(genome.petalWidth.value/2, 0, 0));
        let leftPoint = tip.scale(genome.teardropShape.value)
            .add(new Vector3(-genome.petalWidth.value/2, 0, 0));

        let petalCurl = genome.petalCurl.value * Math.PI / 2;
        rightPoint.rotateByQuaternionToRef(Quaternion.RotationYawPitchRoll(0, 0, petalCurl), rightPoint);
        leftPoint.rotateByQuaternionToRef(Quaternion.RotationYawPitchRoll(0, 0, -petalCurl), leftPoint);

        let petalTipCurl = genome.petalTipCurl.value * Math.PI / 2;
        tip.rotateByQuaternionToRef(Quaternion.RotationYawPitchRoll(0, -petalTipCurl, 0), tip);

        let petalCenterCurl = genome.petalCenterCurl.value * Math.PI / 2;
        center.rotateByQuaternionToRef(Quaternion.RotationYawPitchRoll(0, -petalCenterCurl, 0), center);

        rightPoint.toArray(this.vertices, 3);
        tip.toArray(this.vertices, 6);
        leftPoint.toArray(this.vertices, 9);
        center.toArray(this.vertices, 12);

        this.indices = [
            // front faces
            0, 1, 4,
            1, 2, 4,
            2, 3, 4,
            3, 0, 4,
            // back faces
            4, 1, 0,
            4, 2, 1,
            4, 3, 2,
            4, 0, 3,
        ]

        let color = new Color3();
        Color3.HSVtoRGBToRef(genome.petalHue.value, genome.petalSat.value, genome.petalVib.value, color);

        this.colors = [];
        color.toColor4(1.0).toArray(this.colors, 0); // base
        color.toColor4(1.0).toArray(this.colors, 4); // right
        color.toColor4(1.0).toArray(this.colors, 8); // tip
        color.toColor4(1.0).toArray(this.colors, 12); // left
        color.toColor4(1.0).toArray(this.colors, 16); // center

        this.uvs = [];
        Vector2.One().toArray(this.uvs, 0); // base
        Vector2.One().toArray(this.uvs, 2); // right
        Vector2.One().toArray(this.uvs, 4); // tip
        Vector2.One().toArray(this.uvs, 6); // left
        Vector2.One().toArray(this.uvs, 8); // center

        // Create unique name
        let name = `petal${petalNum}`;

        // Create Babylon.js mesh
        this.mesh = new Mesh(name);

        let vertexData = new VertexData();

        vertexData.positions = this.vertices;
        vertexData.indices = this.indices;
        vertexData.colors = this.colors;
        vertexData.uvs = this.uvs;
        vertexData.normals = [];
        VertexData.ComputeNormals(this.vertices, this.indices, vertexData.normals);

        vertexData.applyToMesh(this.mesh);
    }
}
  
export const FlowerGeometry: any = {
    petalBase: {
        shape: [
            new Vector3(0.0, 0.0, 0.0),
            new Vector3(0.5, 0.0, 0.5),
            new Vector3(0.5, 0.0, -0.5)
        ]
    },
    petalTip: {
        shape: [
            new Vector3(0.5, 0.0, 0.5),
            new Vector3(1.0, 0.0, 0.0),
            new Vector3(0.5, 0.0, 0.5)
        ]
    },
    stem: {
        shape: [
            new Vector3(0.05, 0.05, 0.0), 
            new Vector3(-0.05, 0.05, 0.0), 
            new Vector3(0.0, -0.05, 0.0), 
            new Vector3(0.05, 0.05, 0.0)
        ],
        path: [
            Vector3.Zero(), 
            new Vector3(0.1, 0.5, 0.0),
            new Vector3(0.0, 1.0, 0.0)
        ],
    }
}

export class Flower {
    info: FlowerPacket;

    rootPosition: Vector3;
    stemIndex: number;
  
    static createNewInstance(genome: FlowerGenome, position: Vector3, scene: Scene) {
        let newInstance = new FlowerPacket(
            uuidv4(), 
            {x:position.x, y:position.z}, 
            genome);
        return new Flower(newInstance, scene);
    }

    constructor(info: FlowerPacket, scene: Scene) {
        this.info = info;

        this.rootPosition = new Vector3(this.info.location.x, 25, this.info.location.y);
        let ray = new Ray(this.rootPosition, Vector3.Down(), 100);
        let pickInfo = scene.pickWithRay(ray, mesh => mesh.name == 'terrain');
        if (pickInfo.hit) {
            this.rootPosition = pickInfo.pickedPoint.clone();
        } else {
            console.log("ERROR: could not find terrain when placing flower");
        }

        this.regenerateFromGenome(info.genome);
    }

    regenerateFromGenome(flowerGenome: FlowerGenome) {
        // // update the genome
        // this.info.genome = flowerGenome;

        // // remember current mesh position if applicable
        // let newTransform = null;
        // if (this.mesh) {
        //     newTransform = this.mesh.getWorldMatrix();
        //     this.mesh.dispose();
        // }

        // let intNumPetals = Math.round(flowerGenome.numPetals.value);
        // let rotation = Math.PI * 2 / intNumPetals;
        // let angleClosed = Math.PI / 2 * flowerGenome.flowerClosed.value;

        // let meshArray = [];
        // for (let i=0; i<intNumPetals; i++) {
        //     let petal = new Petal(flowerGenome, i);
        //     let mesh = petal.mesh;
        //     mesh.rotate(Vector3.Right(), -angleClosed, Space.WORLD)
        //     mesh.rotate(Vector3.Up(), rotation*i, Space.WORLD);

        //     let petalScale = flowerGenome.petalSize.value;
        //     if (i == 0) petalScale *= flowerGenome.firstPetalSize.value;
            
        //     mesh.scaling = Vector3.One().scale(petalScale);

        //     meshArray.push(mesh);
        // }

        // let stemColor = new Color4(0.1, 0.8, 0.1, 1);
        // let stemColorData = [];
        // let stem = MeshBuilder.ExtrudeShapeCustom('stem', {
        //     shape: [
        //         new Vector3(flowerGenome.stemThickness.value, flowerGenome.stemThickness.value), 
        //         new Vector3(-flowerGenome.stemThickness.value, flowerGenome.stemThickness.value), 
        //         new Vector3(0, -flowerGenome.stemThickness.value), 
        //         new Vector3(flowerGenome.stemThickness.value, flowerGenome.stemThickness.value)
        //     ],
        //     path: [
        //         Vector3.Zero(), 
        //         new Vector3(0.1, flowerGenome.stemLength.value/2, 0),
        //         new Vector3(0, flowerGenome.stemLength.value, 0)
        //     ],
        // });
        // let numStemVerts = stem.getVerticesData(VertexBuffer.PositionKind).length / 3;
        // for (let i=0; i<numStemVerts; i++) {
        //     stemColor.toArray(stemColorData, i*4);
        // }
        // stem.setVerticesData(VertexBuffer.ColorKind, stemColorData);

        // let merged = Mesh.MergeMeshes(meshArray, true);
        // merged.translate(Vector3.Up(), flowerGenome.stemLength.value);
        // merged = Mesh.MergeMeshes([merged, stem], true);
        // merged.scaling = Vector3.One().scale(0.2);
        // merged.convertToFlatShadedMesh();

        // merged.name = this.info.id;
        // merged.metadata = this;
        // this.mesh = merged;

        // // restore mesh position
        // if (newTransform) {
        //     var quatRotation =  new Quaternion();
        //     var position = new Vector3();
        //     var scale = new Vector3();

        //     newTransform.decompose(scale, quatRotation, position);

        //     this.mesh.setAbsolutePosition(position);
        //     this.mesh.rotationQuaternion = quatRotation;
        // }
    }
};