
import { 
    Scene
} from "@babylonjs/core";

import { FlowerLocations } from '../common/flowerLocations';
import { FlowerPacket } from '../common/flowerPacket';
import { Flower } from './flower';

export class FlowerField {
    
    locations: FlowerLocations;
    pointMap: any;
    scene: Scene;

    flowers: Map<string, Flower>;

    constructor(scene: Scene) {
        this.locations = new FlowerLocations();
        this.scene = scene;
        this.flowers = new Map<string, Flower>();
    }

    // add new flowers to the field and remove replaced flowers
    addFlowers(flowerPackets: FlowerPacket[]): void {
        // don't add flowers that already exist
        let newFlowers = flowerPackets.filter( (packet) => !this.locations.hasFlower(packet.id) );

        // add flowers to scene
        newFlowers.forEach( (packet) => {
            let flower = new Flower(packet, this.scene);
            this.flowers.set(packet.id, flower);
        });

        // remove flowers we have replaced
        this.removeFlowers(this.locations.addFlowers(newFlowers));
    }

    hasFlower(flowerID: string): boolean {
        return this.locations.hasFlower(flowerID);
    }

    getAllFlowerIDs(): string[] {
        return this.locations.getAllFlowerIDs();
    }

    // remove a list of flowers by name
    removeFlowers(flowerIDs: string[]): void {
        flowerIDs.forEach( (id) => {
            if (this.flowers.has(id)) {
                this.flowers.get(id).mesh.dispose();
                this.flowers.delete(id);
            }
            this.locations.removeFlower(id);
        });
    }

    // fetch only the flowers in a circle around the specified point
    getFlowersAroundPoint(x: number, y: number, radius: number): string[] {
        return this.locations.getFlowersAroundPoint(x, y, radius);
    }

    // remove all flowers outside the circle
    // return list of flowers removed by name
    removeFlowersNotAroundPoint(x: number, y: number, radius: number): string[] {
        return this.locations.removeFlowersNotAroundPoint(x, y, radius);
    }
}