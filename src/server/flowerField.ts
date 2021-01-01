
import { QuadTree, Box, Point, Circle} from 'js-quadtree';

export class FlowerField {
    
    quadtree: QuadTree;

    constructor() {
        this.quadtree = new QuadTree(new Box(-500, -500, 1000, 1000));
    }

    // add a new flower to the quadtree
    // returns: list of flowers to remove
    addFlower(x: number, y: number, flowerID: string, exclusionRange?: number): string[] {
        let results = new Array<string>();
        if (exclusionRange) {
            let toRemove = this.quadtree.query(new Circle(x, y, exclusionRange));
            this.quadtree.remove(toRemove);
            results = toRemove.map(point => point.data);
        }
        this.quadtree.insert(new Point(x, y, flowerID));
        return results;
    }

    // fetch only the flowers around a certain point
    getFlowersAroundPoint(x: number, y: number, radius: number): string[] {
        return this.quadtree.query(new Circle(x, y, radius)).map( (point: Point) => {
            return point.data;
        });
    }
}