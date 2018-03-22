'use strict';

const app = require('express')();
const fs = require('fs');
const morgan = require('morgan');
const path = require('path');
// const url = require('url');
const uuid = require('uuid');
const http = require('http');
//const http = require('http').Server(app);
const WebSocket = require('ws');


const CONTROL_MESSAGES = Object.freeze({
    SHUT_DOWN : 'SHUT_DOWN',
    SET_UUID: 'SET_UUID',
    SEND_DATA: 'SEND_DATA',
    BROADCAST: 'BROADCAST',
    INIT_CLIENT: 'INIT_CLIENT',
});



// We will have these headers applied to all our responses.
const responseHeaders = function(req, res, next){
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Allow-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Allow-Control-Allow-Headers', 'Content-Type');
    next();
};
app.use(responseHeaders);

// create a write stream (in append mode) & setup logging for http requests
const accessLogStream = fs.createWriteStream(path.resolve(`${__dirname}/../access.log`), {flags: 'a'});
app.use(morgan('combined', {stream: accessLogStream}));

// app.get('/', function(req, res){
//     res.sendFile( path.resolve(`${__dirname}/../webcontent/index.html`));
// });
//
// http.listen(3000, function(){
//     console.log('listening on *:3000');
// });


const server = http.createServer(app);
const wss = new WebSocket.Server({ server, clientTracking: true });
const connectedClients = new Map();

const broadCastMessage = function(){

};

wss.on('connection', function connection(ws, req) {
    // const location = url.parse(req.url, true);
    const ip = req.connection.remoteAddress;
    const id = uuid.v4();

    connectedClients.set(id, { ws, identity: '', status: '', last_msg: '' });

    // Handle incoming messages from Clients
    ws.on('message', function (msg) {
        let sendMessage = {};
        const message = JSON.parse(msg);
        console.log(`Received data: ${message.content}, Status: ${message.status}`);

        switch(message.type){
        case CONTROL_MESSAGES.SHUT_DOWN:
            wss.close();
            break;
        case CONTROL_MESSAGES.INIT_CLIENT:
            connectedClients.get(message.uuid).identity = message.content;
            connectedClients.get(message.uuid).status = message.status;
            connectedClients.get(message.uuid).last_msg = message.content;

            broadCastMessage();
            break;
        case CONTROL_MESSAGES.SEND_DATA:    /* falls through */
        default:
            connectedClients.get(message.uuid).status = message.status;
            connectedClients.get(message.uuid).last_msg = message.content;

            sendMessage = { type: CONTROL_MESSAGES.SEND_DATA, content: `echo something from ${ip}: ${message.content}` };
            ws.send(JSON.stringify(sendMessage));
        }

    });


    ws.on('error', function(error){
        console.log(`Error occurred: ${error}`);
    });


    ws.on('close', function(code, reason){
        console.log(`Connection closed. Code: ${code}, Reason: ${reason}`);
        connectedClients.delete(id);
    });


    console.log(`Connected to ${ip}`);
    const initMessage = { type: CONTROL_MESSAGES.SET_UUID, content: id };
    ws.send(JSON.stringify(initMessage));
});


server.listen(8080, function listening() {
    console.log(`Listening on %d`, server.address().port);
});