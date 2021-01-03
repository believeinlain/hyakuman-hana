
import { QuadTree, Box, Point, Circle } from 'js-quadtree';
import { FlowerInstance } from './flowerInstance';

export class FlowerField {
    
    quadtree: QuadTree;
    pointMap: any;

    constructor() {
        this.quadtree = new QuadTree(new Box(-500, -500, 1000, 1000));
        this.pointMap = {};
    }

    // add a new flower to the quadtree
    // returns: list of flowers to remove
    addFlower(x: number, y: number, flowerID: string, exclusionRange: number = 0): string[] {
        let results = new Array<string>();
        if (exclusionRange > 0) {
            //console.log("Looking for flowers to remove");
            let toRemove = this.quadtree.query(new Circle(x, y, exclusionRange));
            toRemove.forEach(point => {
                //console.log("Found flower to remove");
                this.removeFlower(point.data);
                results.push(point.data);
            });
        }
        let newPoint = new Point(x, y, flowerID);
        this.quadtree.insert(newPoint);
        this.pointMap[flowerID] = newPoint;
        
        return results;
    }

    hasFlower(flowerID: string): boolean {
        return this.pointMap.hasOwnProperty(flowerID);
    }

    getAllFlowerIDs(): string[] {
        return Object.keys(this.pointMap);
    }

    // remove a flower by name
    removeFlower(flowerID: string) {
        //console.log("Attempting to remove flower", flowerID);
        //console.log("PointMap:", this.pointMap);
        this.quadtree.remove(this.pointMap[flowerID]);
        delete this.pointMap[flowerID];
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