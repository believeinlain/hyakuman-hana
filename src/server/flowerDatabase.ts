
import low from 'lowdb';
import FileAsync from 'lowdb/adapters/FileAsync';

import { FlowerInstance } from "../common/flowerInstance";

var backup = require('backup');

type DatabaseStructure = {flowers: FlowerInstance[]};

export class FlowerDatabaseInstance {

    database: low.LowdbAsync<DatabaseStructure>;
    defaults: DatabaseStructure;

    constructor(db: low.LowdbAsync<DatabaseStructure>, defaults) {
        this.database = db;
        this.defaults = defaults;
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

    erase(): void {
        this.database.setState(this.defaults);
    }

    // TODO: save database directory in object, not hardcoded here
    save(filename: string): void {
        backup.backup('./database/', `./${filename}`);
    }

    getDefaults(): DatabaseStructure {
        return this.defaults;
    }
}

export function OpenFlowerDatabase (
    filename: string,
    onReady: (db: FlowerDatabaseInstance)=>void,
    onFinished: ()=>void,
    defaultContents: DatabaseStructure
) {
    let adapter = new FileAsync(filename);
    low(adapter)
        .then( async (db: low.LowdbAsync<DatabaseStructure>) => {
            onReady(new FlowerDatabaseInstance(db, defaultContents));

            // Set db default values
            try {
                return db.defaults(defaultContents).write();
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

