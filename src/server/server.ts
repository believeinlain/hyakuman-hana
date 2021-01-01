
import { randomBytes } from 'crypto';
import express from 'express';
import http from 'http';
const app = express();
const server = http.createServer(app);
const io = require('socket.io')(server, {
  cors: {
    origin: "http://localhost:8080",
    methods: ["GET", "POST"]
  }
});
const port = 3000;

app.use(express.static('public'));

// Initialize database
import low from 'lowdb';
import FileAsync from 'lowdb/adapters/FileAsync';
import { type } from 'os';
import { Socket } from 'socket.io';
const adapter = new FileAsync('db.json');
type FlowerDB = low.LowdbAsync<{flowers: FlowerInstance[]}>;

import { v4 as uuidv4 } from 'uuid';

// flower field
import { FlowerField } from './flowerField';
import { FlowerGenome, FlowerInstance } from '../common/flowerInstance';
import { ServerParameters } from '../common/serverParameters';

// Server parameters
const serverParameters: ServerParameters = {
  flowerRange: 25,
  flowerExclusionRange: 0.5,
  flowerSpreadInterval: 1000,
  flowerSpreadFraction: 0.01,
  maxFlowerUpdates: 100
}

function addNewFlowers(flowers: FlowerInstance[], db: FlowerDB, field: FlowerField) {
  let toRemove = new Array<string>();
  flowers.forEach( (flower: FlowerInstance) => {
    // add it to the database
    db.get('flowers').push(flower).write();
    // add it to the quadtree
    toRemove.concat(field.addFlower(
      flower.location.x, 
      flower.location.y, 
      flower.id, 
      serverParameters.flowerExclusionRange
    ));
  });
  toRemove.forEach( flowerID => {
    io.sockets.emit('deleteFlower', flowerID);
    db.get('flowers').remove({id: flowerID}).write();
  });
}

// Asynchronously load database
// TODO: backup database periodically
low(adapter)
  .then( (db: low.LowdbAsync<{flowers: FlowerInstance[]}>) => {
    // wrapper for the quadtree of flowers
    const flowerField = new FlowerField();

    // Load all of the flower ids into the quadtree
    let flowerarray = db.getState().flowers;
    if (flowerarray) {
      flowerarray.forEach( (flower: FlowerInstance) => {
        flowerField.addFlower(flower.location.x, flower.location.y, flower.id);
      });
    }

    // Set interval to spread flowers
    setInterval( () => {
      // select flowers to update
      let allFlowerIDs = flowerField.quadtree.getAllPoints().map(point => point.data);
      let rootSelection = allFlowerIDs.filter(id => Math.random() < serverParameters.flowerSpreadFraction);
      rootSelection = rootSelection.slice(0, serverParameters.maxFlowerUpdates);
      // spread
      rootSelection.forEach( flowerID => {
        let rootInstance = db.get('flowers').find({id: flowerID}).value();
        // create two new flowers for each
        // TODO: flowers can overlap if new angles are close - fix this
        if (rootInstance) {
          let newFlowers = new Array<FlowerInstance>();
          for (let i=0; i<2; i++) {
            let randomAngle = Math.random() * Math.PI * 2;
            let offsetX = Math.cos(randomAngle)*serverParameters.flowerExclusionRange*1.1;
            let offsetY = Math.sin(randomAngle)*serverParameters.flowerExclusionRange*1.1;
            let newInstance = new FlowerInstance(
              uuidv4(), 
              {
                x: rootInstance.location.x+offsetX,
                y: rootInstance.location.y+offsetY
              },
              FlowerGenome.mutate(rootInstance.genome)
            );
            newFlowers.push(newInstance);
            io.sockets.emit('newFlower', newInstance);
          }
          addNewFlowers(newFlowers, db, flowerField);
        }
      });
    }, serverParameters.flowerSpreadInterval);

    // handle client connections once db is loaded
    io.on('connection', (socket: Socket) => {
      console.log("New connection from", socket.handshake.address, ", id:", socket.id);
      console.log("Total connections:", io.engine.clientsCount);

      socket.emit('config', serverParameters);
  
      // on position update received from client, send all flower ids
      // around position within range, to load if necessary
      socket.on('positionUpdate', (data: {x:number, y:number}) => {
        //console.log("Received position update", data);
        flowerField.getFlowersAroundPoint(data.x, data.y, serverParameters.flowerRange).forEach( 
          (flowerID: string) => {
            socket.emit('isFlowerLoaded', flowerID);
          });
      })
  
      // if we need to load a particular flower, fetch it from the database
      socket.on('requestFlower', (flowerID: string) => {
        //console.log("Received flower request", flowerID);
        const flower = db.get('flowers').find({id: flowerID}).value();
        socket.emit('sendFlower', flower);
      });
  
      // we just planted a new flower
      socket.on('plantFlower', (flower: FlowerInstance) => {
        addNewFlowers([flower], db, flowerField);
      });
  
      socket.on('disconnect', () => {
          console.log("Client id", socket.id, "disconnected");
          console.log("Total connections", io.engine.clientsCount);
      })
    });

    // Set db default values
    return db.defaults({ flowers: [] }).write()
  })
  .then(() => {
    server.listen(port, () => {
      return console.log(`server is listening on ${port}`);
    });
  });

