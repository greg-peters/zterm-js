var WebSocket = require('ws');
var terminal = require('../index');
var vscode = null;
var wss = null;

module.exports = {

    setDelayTime: (ms) => {
        terminal.setDelayTime(ms);
    },

    enableLogging: (enable) => {
        terminal.enableLogging(enable);
    },

    getText: (row,col,length) => {
        return terminal.getText(row,col,length);
    },

    setText: (text,row,col) => {
        send({action: 'Inserting...',setText: text,row: row,col: col});
        terminal.setText(text,row,col);
    },

    getRowContainingText: (text,ignoreCase) => {
        return terminal.getRowContainingText(text,ignoreCase);
    },

    waitForText: async (text,ignoreCase,timeout)=> {
        await terminal.sleep(terminal.getDelayTime());
        send({action: 'Recognizing...'});
        await terminal.sleep(terminal.getDelayTime());
        return terminal.waitForText(text,ignoreCase,timeout);
    },

    waitForNotText: async (text,ignoreCase,timeout)=> {
        await terminal.sleep(terminal.getDelayTime());
        send({action: 'Recognizing...'});
        await terminal.sleep(terminal.getDelayTime());
        return terminal.waitForNotText(text,ignoreCase,timeout);
    },

    sendCommand: async (command,row,col) => {
        await terminal.sleep(terminal.getDelayTime());
        send({action: 'Transmitting...'});
        await terminal.sendCommand(command,row,col);
        send({action: 'Rendering...',display: await terminal.getDisplay(true)});
    },

    connect: async (host,port) => {
        await terminal.connect(host,port);
        await connectToVSCodeTerminal();
        send({action: 'Rendering...',display: await terminal.getDisplay(true)});
    },

    disconnect: ()=> {
        terminal.disconnect();
        disconnect();
    }

}

function send(data) {
    if(vscode) {
        vscode.send(JSON.stringify(data));
    }
}

async function connectToVSCodeTerminal(port) {
    return new Promise((resolve,reject) => {
        wss = new WebSocket.Server({port: port?port:31454});
        wss.on('connection', function connection(ws) {
            vscode = ws;
        
            vscode.on('message', function incoming(message) {
                console.log('vscode terminal: %s', message);
            });
        
            vscode.on('close', function() {
                console.log('Disconnected from VSCode terminal');
            });
            resolve();
        });
    });
}

function disconnect() {
    if(vscode) {
        vscode.close();
    }
}
