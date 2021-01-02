
import { FlowerGenome } from './flowerGenome'

// Used to store flowers in a database to be loaded later
export class FlowerInstance {
    genome: FlowerGenome;
    id: string;
    location: {x:number, y:number}; // (x, y) position on terrain

    constructor(
        id: string, 
        location: {x:number, y:number}, 
        genome: FlowerGenome = new FlowerGenome()) 
    {
        this.id = id;
        this.location = location;
        this.genome = genome;
    }
}