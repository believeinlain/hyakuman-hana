import { Point } from 'js-quadtree';
import { FlowerGenome } from './flowerGenome';
import { nanoid } from 'nanoid';

export interface MeshData {
    positions: Float32Array;
    indices: Uint16Array;
    colors: Float32Array;
    uvs: Float32Array;
    normals: Float32Array;
}

export class FlowerData {
    _id: string;
    timestamp: number;
    genome: FlowerGenome;
    location: Point;
    mesh: MeshData;

    constructor(genome: FlowerGenome, x: number, y: number) {
        this._id = nanoid();
        this.genome = genome;
        this.mesh = FlowerGenome.generateMesh(genome);
        this.location = new Point(x, y, this._id);
    }
}
