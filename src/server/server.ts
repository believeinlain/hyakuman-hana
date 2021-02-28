
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
// var vorpal = require('vorpal')();

app.use(express.static('public'));

import { Socket } from 'socket.io';
import { FlowerField } from './flowerField'

import * as protocol from '../common/protocol';
import { FlowerData } from '../common/flowerData';

// Default server parameters
const player_radius = 25;
const flower_radius = 0.5;
const mutation_interval = 10000;
const mutation_num = 10;
const field_width = 1000;
const field_height = 1000;

const flowerField = new FlowerField(field_width, field_height);

// no need to wait for database to init, since it will buffer requests
flowerField.initialize();

// Set interval to spread flowers
setInterval( async () => {
    // mutate flowers
    let {added, removed} = await flowerField.mutateFlowers(mutation_num, flower_radius);

    //TODO: send update to clients
    
}, mutation_interval);

// handle client connections 
io.on('connection', (socket: Socket) => {
    // new client has connected
    console.log("New connection from", socket.handshake.address, ", id:", socket.id);
    console.log("Total connections:", io.engine.clientsCount);

    socket.on('disconnect', () => {
        console.log("Client id", socket.id, "disconnected");
        console.log("Total connections", io.engine.clientsCount);
    });
});

// Open server for connections
server.listen(port, () => {
    return console.log(`server is listening on ${port}`);
});

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
