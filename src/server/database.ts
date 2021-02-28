
var Datastore = require('nedb');

export class Database<DataEntry> {

    private db: Nedb;

    constructor(filename: string) {
        this.db = new Datastore({filename: filename});
    }

    loadDatabase() {
        return new Promise<boolean>(resolve => {
            this.db.loadDatabase(function (err) {
                if (err) {
                    console.log(err);
                    resolve(false);
                } else {
                    resolve(true);
                }
            });
        });
    }

    getIdsNotInDatabase(ids: string[]) {
        return new Promise<string[]>(resolve => {
            this.db.find({_id: {$in: ids}}, {_id:1}, function (err, docs) {
                if (err) console.log(err);
                let overlap = docs.map(doc=>doc._id);
                // resolve only the ids that were not found in database
                resolve(ids.filter(id=>!overlap.includes(id)));
            });
        });
    }

    getAllData(projection?: any) {
        return new Promise<DataEntry[]>(resolve => {
            this.db.find({}, projection, function (err, docs) {
                if (err) console.log(err);
                resolve(docs);
            });
        });
    }

    getData(id: string, projection?: any) {
        return new Promise<DataEntry>(resolve => {
            this.db.findOne({_id: id}, projection, function (err, doc) {
                if (err) console.log(err);
                resolve(doc);
            });
        });
    }

    getDataArray(ids: string[], projection?: any) {
        return new Promise<DataEntry[]>(resolve => {
            this.db.find({_id: {$in: ids}}, projection, function (err, docs) {
                if (err) console.log(err);
                resolve(docs);
            });
        });
    }

    removeData(id: string) {
        return new Promise<number>(resolve => {
            this.db.remove({_id: id}, function (err, numDeleted) {
                if (err) console.log(err);
                resolve(numDeleted);
            });
        });
    }

    removeDataArray(ids: string[]) {
        return new Promise<number>(resolve => {
            this.db.remove({_id: {$in: ids}}, {multi: true}, function (err, numDeleted) {
                if (err) console.log(err);
                resolve(numDeleted);
            });
        });
    }

    addData(data: any) {
        return new Promise<DataEntry>(resolve => {
            this.db.insert(data, function (err, doc) {
                if (err) console.log(err);
                resolve(doc);
            });
        });
    }

    addDataArray(data: any[]) {
        return new Promise<DataEntry[]>(resolve => {
            this.db.insert(data, function (err, docs) {
                if (err) console.log(err);
                resolve(docs);
            });
        });
    }

    async getRandomSelection(n: number) {
        // Randomize array in-place using Durstenfeld shuffle algorithm
        function shuffle(array: any[]) {
            for (let i = array.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [array[i], array[j]] = [array[j], array[i]];
            }
        }
        let count = await this.getNumEntries();
        let data = await this.getAllData();
        shuffle(data);

        return data.slice(0, Math.min(count-1, n));
    }

    getNumEntries() {
        return new Promise<number>(resolve => {
            this.db.count({}, function (err, numEntries) {
                if (err) console.log(err);
                resolve(numEntries);
            });
        });
    }

    eraseAllData() {
        return new Promise<number>(resolve => {
            this.db.remove({}, {multi: true}, function (err, numDeleted) {
                if (err) console.log(err);
                resolve(numDeleted);
            });
        });
    }
}
