/* Shortcuts to DOM elements */
const msgType = document.getElementById('msg_type');
const clientStatus = document.getElementById('client_status');
const clientIdentity = document.getElementById('client_identity');
const textMessage = document.getElementById('textmsg');
const wsClientData = document.getElementById('websocketClientData');
const wsClientDisplay = document.getElementById('websocketClients');
const wsTargets = document.getElementById('target_client');

const connectionStatus = document.getElementById('status');
const errorMsg = document.getElementById('errormsg');
const results = document.getElementById('results');

const sendMessage = document.getElementById('send');
const makeConnection = document.getElementById('connect');
const closeConnection = document.getElementById('close');

/* Control constants that define the context of the message sent */
const CONTROL_MESSAGES = Object.freeze({
    RESET_SERVER: 'RESET_SERVER',
    SET_UUID: 'SET_UUID',
    SEND_DATA: 'SEND_DATA',
    BROADCAST: 'BROADCAST',
    INIT_CLIENT: 'INIT_CLIENT',
    TARGET_CLIENT: 'TARGET_CLIENT',
});

//const wsAddress = 'ws://echo.websocket.org/';
const wsAddress = 'ws://192.168.1.150:8080/';
let websocket = {};
clientStatus.value = 'OK';
clientIdentity.value = `VAC${Math.floor(Math.random() * 10000)}`;

/* Handle incoming message from WebSocket Server */
const handleIncoming = function(msg){
    const messageData = JSON.parse(msg.data);

    switch (messageData.type){
    case CONTROL_MESSAGES.INIT_CLIENT:
        console.log(messageData);

        let newTableData = '';
        let targetOptions = '';
        messageData.content.forEach((client) => {
            newTableData = `${newTableData}
                <tr>
                    <td>${client.identity}</td>
                    <td>${client.ip}</td>
                    <td>${client.status}</td>
                </tr>`;


            targetOptions = `${targetOptions}
                <option value="${client.identity}">${client.identity}</option>`;

        });
        wsTargets.disabled = false;
        wsTargets.innerHTML = targetOptions;
        wsClientData.innerHTML = newTableData;
        wsClientDisplay.classList.remove('no-connect');
        wsTargets.classList.remove('no-connect');
        break;
    case CONTROL_MESSAGES.SEND_DATA:    /* falls through */
    default:
        results.value = messageData.content;
        break;
    }
};

/* Open a connection to the WebSocket Server */
makeConnection.addEventListener('click', () => {
    websocket = new WebSocket(wsAddress);
    errorMsg.classList.add('hidden');

    websocket.onopen = function(evt){
        connectionStatus.innerHTML = 'CONNECTED';

        makeConnection.disabled = true;
        closeConnection.disabled = false;
        sendMessage.disabled = false;

        const message = { type: CONTROL_MESSAGES.INIT_CLIENT, status: clientStatus.value, content: clientIdentity.value };
        websocket.send(JSON.stringify(message));
    };

    websocket.onclose = function(evt){
        connectionStatus.innerHTML = 'DISCONNECTED';

        makeConnection.disabled = false;
        closeConnection.disabled = true;
        sendMessage.disabled = true;
        wsTargets.disabled = true;
        wsClientDisplay.classList.add('no-connect');
        wsTargets.classList.add('no-connect');

        console.log(`Closed with code: ${evt.code}`);
    };

    websocket.onmessage = handleIncoming;

    websocket.onerror = function(evt){
        errorMsg.classList.remove('hidden');
    };
});

/* Open a connection to the WebSocket Server */
closeConnection.addEventListener('click', () => {
    websocket.close(1000, 'Done for the day');
    makeConnection.disabled = false;
    closeConnection.disabled = true;
    sendMessage.disabled = true;
    wsTargets.disabled = true;
    wsClientDisplay.classList.add('no-connect');
    wsTargets.classList.add('no-connect');
});

/* Send a message with a action type based on what was chosen from the selector */
sendMessage.addEventListener('click', () => {
    let message = { type: '', status: '', content: ''};
    switch(msgType.value){
    case CONTROL_MESSAGES.RESET_SERVER:
        message = { type: CONTROL_MESSAGES.RESET_SERVER };
        break;
    case CONTROL_MESSAGES.BROADCAST:    /* falls through */
    case CONTROL_MESSAGES.SEND_DATA:
        message = { type: msgType.value, status: clientStatus.value, content: textMessage.value };
        break;
    case CONTROL_MESSAGES.TARGET_CLIENT:
        message = { type: CONTROL_MESSAGES.TARGET_CLIENT, content: textMessage.value, target: wsTargets.value };
        break;
    }

    websocket.send(JSON.stringify(message));
}, false);