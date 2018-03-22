'use strict';

const express = require('express');
const fs = require('fs');
const morgan = require('morgan');
const path = require('path');
// const url = require('url');
const uuid = require('uuid');
const http = require('http');
const WebSocket = require('ws');

const app = express();

/* Control constants that define the context of the message sent */
const CONTROL_MESSAGES = Object.freeze({
    RESET_SERVER : 'RESET_SERVER',
    SEND_DATA: 'SEND_DATA',
    BROADCAST: 'BROADCAST',
    INIT_CLIENT: 'INIT_CLIENT',
    TARGET_CLIENT: 'TARGET_CLIENT',
});

/* We will have these headers applied to all our http responses. */
const responseHeaders = function(req, res, next){
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Allow-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Allow-Control-Allow-Headers', 'Content-Type');
    next();
};
app.use(responseHeaders);

/* We will serve up our demo-web-page too. */
app.use(express.static('webcontent'));

/* Create a write stream (in append mode) & setup logging for http requests (does not log WebSocket connections. maybe can find a good library to..) */
const accessLogStream = fs.createWriteStream(path.resolve(`${__dirname}/../access.log`), {flags: 'a'});
app.use(morgan('combined', {stream: accessLogStream}));

/* We startup our http and WebSocket servers. We also make a Map to easily track the specifics of connected clients */
const server = http.createServer(app);
let wss = {};

/* Broadcast a message to all connected clients */
const broadCastMessage = function(type, content){
    const sendMessage = { type, content };
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(sendMessage));
        }
    });
};

const startWebSocketServer = function() {
    wss = new WebSocket.Server({server, clientTracking: true});
    const connectedClients = new Map();

    /* Each time a client connects, we kick off this handler */
    wss.on('connection', function connection(ws, req) {
        // const location = url.parse(req.url, true);
        const ip = req.connection.remoteAddress;
        const id = uuid.v4();
        console.log(`Connected to ${ip}`);

        /* Store a reference to the client by it's ws object */
        connectedClients.set(ws, {identity: '', status: '', last_msg: '', ip});

        /* Handle incoming messages from Client */
        ws.on('message', function (msg) {
            let sendMessage = {};
            const message = JSON.parse(msg);
            console.log(`Received data: ${message.content}, Status: ${message.status}`);

            switch (message.type) {
                case CONTROL_MESSAGES.RESET_SERVER:
                wss.close();
                /* Restart the server 5 seconds after closing it */
                setTimeout(() => startWebSocketServer(), 5000);
                break;
            case CONTROL_MESSAGES.INIT_CLIENT:
                connectedClients.get(ws).identity = message.content;
                connectedClients.get(ws).status = message.status;
                connectedClients.get(ws).last_msg = message.content;

                /* Broadcast to all clients that a new Client has connected */
                broadCastMessage(CONTROL_MESSAGES.INIT_CLIENT, [...connectedClients.values()]);
                break;

            case CONTROL_MESSAGES.TARGET_CLIENT:
                const target = [...connectedClients.entries()]
                    .filter((clientEntry) => clientEntry[1].identity === message.target)
                    .pop();
                if (target){
                    sendMessage = {
                        type: CONTROL_MESSAGES.SEND_DATA,
                        content: `You got "${message.content}" from ${connectedClients.get(ws).identity}`
                    };
                    target[0].send(JSON.stringify(sendMessage));
                }
                else{
                    sendMessage = {
                        type: CONTROL_MESSAGES.SEND_DATA,
                        content: `ERROR: "${message.target}" is not connected to the server`
                    };
                    ws.send(JSON.stringify(sendMessage));
                }
                break;

            case CONTROL_MESSAGES.BROADCAST:
                broadCastMessage(CONTROL_MESSAGES.BROADCAST, `Broadcast "${message.content}" sent from ${connectedClients.get(ws).identity} at ${ip}`);
                break;
            case CONTROL_MESSAGES.SEND_DATA:    /* falls through */
            default:
                connectedClients.get(ws).status = message.status;
                connectedClients.get(ws).last_msg = message.content;

                sendMessage = {
                    type: CONTROL_MESSAGES.SEND_DATA,
                    content: `You (${connectedClients.get(ws).identity}) sent "${message.content}" from ${ip}`
                };
                ws.send(JSON.stringify(sendMessage));
            }

        });

        /* Handle erroneous issues */
        ws.on('error', function (error) {
            console.log(`Error occurred: ${error}`);
        });

        /* Handle a client disconnecting */
        ws.on('close', function (code, reason) {
            console.log(`Connection closed. Code: ${code}, Reason: ${reason}`);
            connectedClients.delete(ws);

            /* Broadcast to all clients that a Client has left */
            broadCastMessage(CONTROL_MESSAGES.INIT_CLIENT, [...connectedClients.values()]);
        });


    });
};

/* Start the Server */
startWebSocketServer();

server.listen(8080, function listening() {
    const serverParams = wss.address();
    console.log(`Listening on %d`, server.address().port);
    // console.log(`${wss.url}`);
    console.log(`${serverParams.address} | ${serverParams.family} | ${serverParams.port}`);
});