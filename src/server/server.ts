
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

// Interactive CLI for server
var vorpal = require('vorpal')();

app.use(express.static('public'));

import { Socket } from 'socket.io';
import { FlowerDatabaseInstance, OpenFlowerDatabase } from './flowerDatabase'

import { v4 as uuidv4 } from 'uuid';

import { FlowerLocations } from '../common/flowerLocations';
import { FlowerPacket } from '../common/flowerPacket';
import { FlowerGenome } from '../common/flowerGenome';
import * as protocol from '../common/protocol';

// Default server parameters
const serverParameters = {
  flowerRange: 25,
  flowerExclusionRange: 0.5,
  flowerSpreadInterval: 10000,
  flowerSpreadFraction: 1,
  maxFlowerUpdates: 10
}

/* Randomize array in-place using Durstenfeld shuffle algorithm */
function shuffleArray(array: any[]) {
  for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
  }
}

// add new flowers to the field and find flowers to delete
function addNewFlowers(flowers: FlowerPacket[], db: FlowerDatabaseInstance, field: FlowerLocations) {
  
  // add them to the database
  db.addFlowers(flowers);
  // add them to the quadtree
  let toRemove = field.addFlowers(flowers, serverParameters.flowerExclusionRange);

  // send a list of names for flowers to remove
  if (toRemove.length > 0) {
    io.sockets.emit('deleteFlowers', toRemove);
  } 
  
  // remove all flowers to remove from the database
  db.removeFlowers(toRemove);
}

// global database for access by CLI
var flowerDatabase: FlowerDatabaseInstance = null;

OpenFlowerDatabase('database/db.json', (db: FlowerDatabaseInstance) => 
{
  console.log("\rDatabase is ready.");
  flowerDatabase = db;

  // wrapper for the quadtree of flowers
  var flowerField = new FlowerLocations();

  // Load all of the flower ids into the quadtree
  flowerField.addFlowers(db.getAllFlowers());

  // Set interval to spread flowers
  setInterval( () => {
    // select flowers to update
    let allFlowerIDs = flowerField.quadtree.getAllPoints().map(point => point.data);
    let rootSelection = allFlowerIDs.filter(id => Math.random() < serverParameters.flowerSpreadFraction);
    // shuffle the update selection
    shuffleArray(rootSelection);
    // only update up to maxFlowerUpdates different flowers
    rootSelection = rootSelection.slice(0, serverParameters.maxFlowerUpdates);
    // spread
    rootSelection.forEach( flowerID => {
      let rootInstance = db.getFlower(flowerID);
      // create two new flowers for each
      // TODO: flowers can overlap if new angles are close - fix this
      if (rootInstance) {
        let newFlowers = new Array<FlowerPacket>();
        let randomAngle = Math.random() * Math.PI * 2;
        for (let i=0; i<2; i++) {
          let offsetX = Math.cos(randomAngle+i*Math.PI/2)*serverParameters.flowerExclusionRange*1.1;
          let offsetY = Math.sin(randomAngle+i*Math.PI/2)*serverParameters.flowerExclusionRange*1.1;
          let newInstance = new FlowerPacket(
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
    // new client has connected
    console.log("New connection from", socket.handshake.address, ", id:", socket.id);
    console.log("Total connections:", io.engine.clientsCount);

    socket.on('message_player_update', (message: protocol.message_player_update) => {
      // get flowers within message.current_radius of message.current_location
      let new_flower_ids = flowers_by_location.get_flowers(message.current_location, message.current_radius);
      // if message.full_update, just send all those flowers
      if (message.full_update) {
        // create an array of new flowers with new_flower_ids and meshes
        socket.emit('message_server_update', {
          new_flowers: new_flowers,
          expired_flower_ids: new Array<string>(),
          // where did we think the client was when this update was prepared
          player_location: message.current_location,
          update_time: get_current_time()
        });
      }
      // get flowers within message.previous_radius of message.previous_location
      // find all previous_flowers not in current_flowers
    }

    socket.on('disconnect', () => {
        console.log("Client id", socket.id, "disconnected");
        console.log("Total connections", io.engine.clientsCount);
    })
  });
}, ()=> {
  // Open server for connections
  server.listen(port, () => {
    return console.log(`server is listening on ${port}`);
  });
},
  // database default contents
  { flowers: [] }
);

// Initiate interactive CLI
// vorpal
//   .command('erase', 'Erase flower database and reset.')
//   .action(function(args, callback) {
//     if (flowerDatabase) {
//       flowerDatabase.erase();
//       this.log('Flower database wiped.');
//     }
//     callback();
//   });
// vorpal
//   .command('backup', 'Save a copy of the database with date and time.')
//   .action(function(args, callback) {
//     if (flowerDatabase) {
//       flowerDatabase.save('database.backup');
//       this.log('Flower database backed up.');
//     }
//     callback();
//   });
// vorpal.delimiter('server$').show();
