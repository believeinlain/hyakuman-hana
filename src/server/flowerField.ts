
import { QuadTree, Box, Point, Circle } from 'js-quadtree';
import { FlowerData } from '../common/flowerData';
import { FlowerGenome } from './flowerGenome'
import { Database } from './database';
import { assert } from 'console';

export class FlowerField {
    flower_locations: QuadTree;
    flower_database: Database<FlowerData>;

    constructor (width: number, height: number) {
        // center the QuadTree on 0,0
        let x = width/-2;
        let y = height/-2;
        // create database
        this.flower_database = new Database<FlowerData>('flowers.db');
        // create QuadTree
        this.flower_locations = new QuadTree(new Box(x, y, width, height));
    }

    async initialize() {
        await this.flower_database.loadDatabase();
        // populate QuadTree
        let allPoints = await this.flower_database.getAllData({_id:0, location:1});
        this.flower_locations.insert(allPoints.map(data=>data.location));
    }

    // add flowers to field, removing flowers within radius of added flowers
    // returns: ids of removed flowers
    async addFlowers(flowers: FlowerData[], radius: number): Promise<string[]> {
        let ids_to_add = flowers.map(data=>data._id);
        let new_ids = await this.flower_database.getIdsNotInDatabase(ids_to_add);
        let new_flowers = flowers.filter(data=>new_ids.includes(data._id));
        let points_to_remove = new Array<Point>();

        new_flowers.forEach(data => {
            // only remove flowers this if radius>0
            if (radius > 0) {
                points_to_remove.push(...this.flower_locations.query(
                    new Circle(data.location.x, data.location.y, radius)));
            }
        });

        let ids_to_remove = points_to_remove.map(point=>String(point.data));

        this.flower_locations.remove(points_to_remove);
        this.flower_database.removeDataArray(ids_to_remove);
        
        return ids_to_remove;
    }

    async mutateFlowers(n: number, radius: number) {
        // allocate return arrays
        let flowers_added = FlowerData[n*2];

        let select = await this.flower_database.getRandomSelection(n);
        let j = 0;
        select.forEach( flower => {
            // create two new flowers for each
            let rand_angle = Math.random() * Math.PI * 2;
            for (let i=0; i<2; i++) {
                let offsetX = Math.cos(rand_angle+i*Math.PI/2)*radius*1.1;
                let offsetY = Math.sin(rand_angle+i*Math.PI/2)*radius*1.1;
                let new_flower = new FlowerData(
                    FlowerGenome.mutate(flower.genome),
                    flower.location.x+offsetX,
                    flower.location.y+offsetY
                );
                flowers_added[j+i] = new_flower;
            }
            j++;
        });
        // add new flowers to flowerfield and database and output flowers to remove
        let ids_to_remove = await this.addFlowers(flowers_added, radius);

        return {added: flowers_added, removed: ids_to_remove};
    }
}