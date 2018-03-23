# WebSocketServer
NodeJS WebSocket Server Implementation

## Dependancies
[NodeJS](https://nodejs.org/en/download/package-manager/) 

## Project Setup
Install project dependencies with **node/npm**
```bash
# Install all node/npm libraries, including dev-dependencies
npm install
# Install only those npm libraries needed to run the app in production
composer install --production
```

To attempt to install latest compatible packages version
~ Be sure to test app is functional afterwards, if not revert **package-lock.json** file, and run _npm install_
```bash
npm update
```

## Project Access

Now you can run the WebSocket server
```bash
npm start
```

If running on your local machine, you can access the demo-test page at
_http://localhost:8080/status.html?host=localhost:8080_
*to use a custom host, just change the value of the _host_ query 

~The production demo-test page is at
_http://45.33.83.200:8080/status.html_

To view http access logs, go to _/access_log_
To view websocket access logs, go to _/websocket_log_

## Demo-test page usage

Connect/Disconnect from the WebSocket Server via the _Connect_ and _Close_ buttons. 
The present connection status or errors are show at top of page.

Select the context (control) of the message to send to the WebSocket-Server  
- SEND_DATA: Send over the value in the text area, and get a mirrored response from the server  
- RESET_SERVER: Tell the server to shutdown, then restart in ~5 seconds  
- BROADCAST: Send over the value in the text area, and tell the server to broadcast that message to all connected clients  
- TARGET_CLIENT: Send over the value in the text area, and tell the server to relay the message to a specific client  
- *INIT_CLIENT: Internal control message used for handshaking with Web-Socket server;  
   Client sends over info to identify itself and its initial status (i.e. VAC3271, OK )  
   Server saves this info to the tracked client for future use. Server sends over list of all presently connected clients.
   
Trigger sending message to to the WebSocket Server via _Send_ button.

View all presently connected clients to server in Blue table.

View messages received from Server in Bisque rectangle at page bottom.

## Running as a service
On a linux machine that supports _systemd_ services;
- place the **websocket-server.service** file in the **/etc/systemd/system** directory
- enable, and check that the service is running by
```bash
# enable the service
sudo systemctl enable websocket-server.service
# start the service
sudo systemctl start websocket-server
# check the service is enabled and running
systemctl status websocket-server
```

The service is configured to start the WebSocket server on system startup, and to restart it on error.

