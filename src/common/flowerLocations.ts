
import { QuadTree, Box, Point, Circle } from 'js-quadtree';

import { FlowerPacket } from '../common/flowerPacket';

// Stores flowerIDs in a quadtree by location
export class FlowerLocations {
    
    quadtree: QuadTree;
    pointMap: Map<string, Point>;

    constructor() {
        this.quadtree = new QuadTree(new Box(-500, -500, 1000, 1000));
        this.pointMap = new Map<string, Point>();
    }

    // add a list of flowers to the quadtree
    // returns: list of flowers to remove
    addFlowers(flowerPackets: FlowerPacket[], exclusionRange: number = 0): string[] {
        let results = new Array<string>();
        
        flowerPackets.forEach( (packet) => {
            // don't add flowers already here
            if (this.pointMap.has(packet.id)) return;
            // only remove flowers this if exclusionRange>0
            if (exclusionRange > 0) {
                let toRemove = this.quadtree.query(
                    new Circle(packet.location.x, packet.location.y, exclusionRange));
                toRemove.forEach(point => {
                    this.removeFlower(point.data);
                    results.push(point.data);
                });
            }
            let newPoint = new Point(packet.location.x, packet.location.y, packet.id);
            this.quadtree.insert(newPoint);
            this.pointMap.set(packet.id, newPoint);
        });
        
        return results;
    }

    hasFlower(flowerID: string): boolean {
        return this.pointMap.has(flowerID);
    }

    getAllFlowerIDs(): string[] {
        return Array.from(this.pointMap.keys());
    }

    // remove a flower by name
    removeFlower(flowerID: string) {
        if (this.pointMap.has(flowerID)) {
            this.quadtree.remove(this.pointMap.get(flowerID));
            this.pointMap.delete(flowerID);
        }
    }

    // fetch only the flowers in a circle around the specified point
    getFlowersAroundPoint(x: number, y: number, radius: number): string[] {
        return this.quadtree.query(new Circle(x, y, radius)).map(point => point.data);
    }

    // remove all flowers outside the circle
    // return list of flowers removed by name
    removeFlowersNotAroundPoint(x: number, y: number, radius: number): string[] {
        let allFlowers = this.quadtree.getAllPoints();
        let flowersInRange = this.quadtree.query(new Circle(x, y, radius));
        let flowersNotInRange = allFlowers.filter( flower => !flowersInRange.includes(flower) );
        this.quadtree.remove(flowersNotInRange);
        return flowersNotInRange.map(point => point.data);
    }
}