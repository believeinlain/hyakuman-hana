
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
import { FlowerField } from '../common/flowerField';
import { FlowerInstance } from '../common/flowerInstance';
import { FlowerGenome } from '../common/flowerGenome';
import { PositionUpdate, ServerParameters } from '../common/protocol';

// Default server parameters
const serverParameters: ServerParameters = {
  flowerRange: 25,
  flowerExclusionRange: 0.5,
  flowerSpreadInterval: 1000,
  flowerSpreadFraction: 0.01,
  maxFlowerUpdates: 100
}

// Asynchronously load database
// TODO: backup database periodically
low(adapter)
  .then( (db: low.LowdbAsync<{flowers: FlowerInstance[]}>) => {
    // wrapper for the quadtree of flowers
    var flowerField = new FlowerField();

    // Load all of the flower ids into the quadtree
    let flowerarray = db.getState().flowers;
    if (flowerarray) {
      flowerarray.forEach( (flower: FlowerInstance) => {
        flowerField.addFlower(flower.location.x, flower.location.y, flower.id);
      });
    }

    function addNewFlowers(flowers: FlowerInstance[], db: FlowerDB, field: FlowerField) {
      let toRemove = new Array<string>();
      flowers.forEach( (flower: FlowerInstance) => {
        //console.log("Adding new flower");
        // add it to the database
        db.get('flowers').push(flower).write();
        // add it to the quadtree
        toRemove.push(...field.addFlower(
          flower.location.x, 
          flower.location.y, 
          flower.id, 
          serverParameters.flowerExclusionRange
        ));
      });
      // send a list of names for flowers to remove
      if (toRemove.length > 0) {
        //console.log("Sent flowers to remove to client");
        io.sockets.emit('deleteFlowers', toRemove);
      } else {
        //console.log("No flowers to remove");
      }
      
      // remove all flowers to remove from the database and field
      //console.log("Deleting flowers:", toRemove);
      toRemove.forEach( flowerID => {
        db.get('flowers').remove({id: flowerID}).write();
        //field.removeFlower(flowerID);
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
          let randomAngle = Math.random() * Math.PI * 2;
          for (let i=0; i<2; i++) {
            let offsetX = Math.cos(randomAngle+i*Math.PI/2)*serverParameters.flowerExclusionRange*1.1;
            let offsetY = Math.sin(randomAngle+i*Math.PI/2)*serverParameters.flowerExclusionRange*1.1;
            let newInstance = new FlowerInstance(
              uuidv4(), 
              {
                x: rootInstance.location.x+offsetX,
                y: rootInstance.location.y+offsetY
              },
              FlowerGenome.mutate(rootInstance.genome)
            );
            newFlowers.push(newInstance);
          }
          // send instances for the flowers to send
          io.sockets.emit('addFlowers', newFlowers);
          // add new flowers to flowerfield and database and determine flowers to remove
          addNewFlowers(newFlowers, db, flowerField);
        }
      });
    }, serverParameters.flowerSpreadInterval);

    // handle client connections once db is loaded
    io.on('connection', (socket: Socket) => {
      console.log("New connection from", socket.handshake.address, ", id:", socket.id);
      console.log("Total connections:", io.engine.clientsCount);

      socket.on('init', () => socket.emit('config', serverParameters));
  
      // on position update received from client, send all flower ids
      // around position within range, to load if necessary
      socket.on('positionUpdate', (data: PositionUpdate) => {
        console.log("Received position update", data.position);
        let flowersToLoad = flowerField.getFlowersAroundPoint(
          data.position.x, data.position.y, serverParameters.flowerRange);
        // send only flowers that aren't loaded
        let flowersToAdd = flowersToLoad.filter(flowerID => !data.loadedFlowerIDs.includes(flowerID));
        // remove flowers that are loaded but shouldnt be
        let flowersToRemove = data.loadedFlowerIDs.filter(flowerID => !flowersToLoad.includes(flowerID));
        // send instances for the flowers to send
        socket.emit('addFlowers', flowersToAdd.map(
          flowerID => db.get('flowers').find({id: flowerID}).value()));
        // send a list of names for flowers to remove
        socket.emit('deleteFlowers', flowersToRemove);
      });
  
      // we just planted a new flower
      socket.on('plantFlower', (flower: FlowerInstance) => {
        console.log("Client planted flower");
        io.sockets.emit('addFlowers', [flower]);
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

