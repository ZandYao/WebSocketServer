const msgType = document.getElementById('msg_type');
const clientStatus = document.getElementById('client_status');
const clientIdentity = document.getElementById('client_identity');
const textMessage = document.getElementById('textmsg');

const connectionStatus = document.getElementById('status');
const errorMsg = document.getElementById('errormsg');
const uuidDisplay = document.getElementById('uuid');
const results = document.getElementById('results');

const sendMessage = document.getElementById('send');
const makeConnection = document.getElementById('connect');
const closeConnection = document.getElementById('close');

const CONTROL_MESSAGES = Object.freeze({
    SHUT_DOWN: 'SHUT_DOWN',
    SET_UUID: 'SET_UUID',
    SEND_DATA: 'SEND_DATA',
    BROADCAST: 'BROADCAST',
    INIT_CLIENT: 'INIT_CLIENT',
});

//const wsAddress = 'ws://echo.websocket.org/';
const wsAddress = 'ws://192.168.1.150:8080/';
const clientInfo = {};
let websocket = {};
clientStatus.value = 'OK';
clientIdentity.value = `VAC${Math.floor(Math.random() * 10000)}`;

// Handle incoming message from WebSocket Server
const handleIncoming = function(msg){
    const messageData = JSON.parse(msg.data);

    switch (messageData.type){
    case CONTROL_MESSAGES.SET_UUID:
            uuidDisplay.innerHTML = clientInfo.uuid = messageData.content;

            // Now that we have a uuid on the server, we send the WebSocket server some info on ourselves to help id us more.
            const sendMessage = { type: CONTROL_MESSAGES.INIT_CLIENT, status: clientStatus.value, content: clientIdentity.value, uuid: clientInfo.uuid };
            websocket.send(JSON.stringify(sendMessage));
            break;
    case CONTROL_MESSAGES.SEND_DATA:    /* falls through */
    default:
        results.value = messageData.content;
        break;
    }
};

makeConnection.addEventListener('click', () => {
    websocket = new WebSocket(wsAddress);
    errorMsg.classList.add('hidden');

    websocket.onopen = function(evt){
        connectionStatus.innerHTML = 'CONNECTED';

        makeConnection.disabled = true;
        closeConnection.disabled = false;
        sendMessage.disabled = false;


    };

    websocket.onclose = function(evt){
        connectionStatus.innerHTML = 'DISCONNECTED';

        makeConnection.disabled = false;
        closeConnection.disabled = true;
        sendMessage.disabled = true;

        console.log(`Closed with code: ${evt.code}`);
    };

    websocket.onmessage = handleIncoming;

    websocket.onerror = function(evt){
        errorMsg.classList.remove('hidden');
    };
});


closeConnection.addEventListener('click', () => {
    websocket.close(1000, 'Done for the day');
    makeConnection.disabled = false;
    closeConnection.disabled = true;
    sendMessage.disabled = true;
});


sendMessage.addEventListener('click', () => {
    const message = { type: msgType.value, status: clientStatus.value, content: textMessage.value, uuid: clientInfo.uuid };
    websocket.send(JSON.stringify(message));
}, false);