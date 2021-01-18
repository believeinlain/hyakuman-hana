
import low from 'lowdb';
import FileAsync from 'lowdb/adapters/FileAsync';

import { FlowerInstance } from "../common/flowerInstance";

type DatabaseStructure = {flowers: FlowerInstance[]};

export class FlowerDatabaseInstance {

    database: low.LowdbAsync<DatabaseStructure>;

    constructor(db: low.LowdbAsync<DatabaseStructure>) {
        this.database = db;
    }

    getAllFlowers(): FlowerInstance[] {
        let allFlowers = new Array<FlowerInstance>();
        allFlowers.push(...this.database.getState().flowers);
        return allFlowers;
    }

    getFlower(flowerID: string): FlowerInstance {
        return this.database.get('flowers').find({id: flowerID}).value();
    }

    getFlowers(flowerIDs: string[]): FlowerInstance[] {
        let selection = new Array<FlowerInstance>();
        flowerIDs.forEach( flowerID => {
            selection.push(this.getFlower(flowerID));
        });
        return selection;
    }

    removeFlowers(flowerIDs: string[]): void {
        flowerIDs.forEach( flowerID => {
            this.database.get('flowers').remove({id: flowerID}).write();
        });
    }

    addFlowers(flowers: FlowerInstance[]): void {
        // for each flower
        flowers.forEach( (flower: FlowerInstance) => {
            // add it to the database
            this.database.get('flowers').push(flower).write();
        });
    }
}

export function OpenFlowerDatabase (
    filename: string,
    onReady: (db: FlowerDatabaseInstance)=>void,
    onFinished: ()=>void,
    defaultContents: ()=>DatabaseStructure
) {
    let adapter = new FileAsync(filename);
    low(adapter)
        .then( async (db: low.LowdbAsync<DatabaseStructure>) => {
            onReady(new FlowerDatabaseInstance(db));

            // Set db default values
            try {
                return db.defaults(defaultContents()).write();
            } catch (e) {
                console.log("Error: Failed to initialize database");
            }
        })
        .then( onFinished )
        .catch( (err) => {
            console.log("Error: Failed to load database");
            console.error(err);
        });
}

