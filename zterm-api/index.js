const net = require('net');
const tls = require('tls');
const telnet = require('./lib/telnet');
const orders = require('./lib/orders');
const commands = require('./lib/commands');
const log = require('./lib/debug');
const wcc = require('./lib/wcc');
const display = require('./lib/display');
const aid = require('./lib/aid');
const ctable = require('./lib/ctable');
const constants = require('./lib/constants');
var sendBuffer = [];

var keyboardLocked = true;
var client = null;

var handledCommands = false; //used to determine if the TN3270 commands have already been handled for the stream
var bufferArray = [];
var delayTime = 10;

module.exports = {

    /**
     * Enabled console logging for interaction with the mainframe
     * @param {Boolean} enable Set to true if you want to enable logging
     */
    enableLogging: (enable) => {
        if(enable) {
            log.enable();
        } else {
            log.disable();
        }
    },

    /**
     * Set the delay time between each mainframe display interaction. This
     * helps with seeing a script play slower to identify issues with the scripting process.
     * @param {Number} ms The number of millisecond to wait between interactions
     */
    setDelayTime: (ms) => {
        delayTime = ms;
    },

    /**
     * The time in milliseconds to delay between actions to help debugging
     * @returns {Number} The time in milliseconds to delay each action
     */
    getDelayTime: ()=> {
        return delayTime;
    },

    connect: (host,port) => {
        return new Promise((resolve,reject) => {
            //this code is for insecure calls
            // client = net.createConnection({ host, port }, () => {
                
            // });

            client = tls.connect({ host, port }, () => {
                
            });


            client.on('data', async (data) => {
                if(telnet.handleNegotiation(data,client)) {        
                    return;
                }

                bufferArray.push(data);

                const combinedBuffer = Buffer.concat(bufferArray);

                // Check if the data stream ends with 0xFF 0xEF
                // The mainframe can send back multiple 0xFF and 0xEF commands within a data stream (block mode)
                if (combinedBuffer.length >= 2 && combinedBuffer[combinedBuffer.length - 2] === 0xFF && combinedBuffer[combinedBuffer.length - 1] === 0xEF) {
                    // If the end sequence is found, handle the data stream.
                    // Here the combined buffer may contain multiple 0xFF (End of Record) 0xEF (End of Stream) codes
                    // so we must parse each of them in turn.
                    if (module.exports.handle3270Datastream(combinedBuffer)) {
                        handledCommands = false;
                        resolve();

                        // Clear the buffer array after processing
                        bufferArray.length = 0;
                    }
                }
            });
              
            client.on('error', (err) => {
                log.debug(`Connection error: ${err}`);
                reject(err);
            });
              
            client.on('end', () => {
                log.debug('Disconnected from mainframe');
                reject();
            });
        });
    },

    /**
     * Disconnects from the current connected mainframe. If not connected, this command is ignored
     */
    disconnect: () => {
        if(client) {
            client.end();
        }
    },

    handle3270Datastream: (data) => {
        //we read raw EBCDIC data from the TN3270 datastream (DEBUG STATEMENT)
        if(log.isDebugging()) {
            for(var i=0;i < data.length; i++) {
                process.stdout.write(' 0x' + data[i].toString(16).toUpperCase().padStart(2, '0'));
                if(data[i] == 239) {
                    process.stdout.write('\r\n\r\n');
                }
            }
        }
        var index = 0;
        if(!handledCommands) {
            //handling TN3270 commands does not alter the display buffer position????
            index = handleTN3270Commands(data); //this handles erasing, writing and other display buffer commands
            index++;
        }
        var processingStream = true;
        while (processingStream) {
            // display.reset();
            index = orders.processOrders(data.slice(index));
            if(index == -1) {
                processingStream = false;
            } else {
                data = data.slice(index+3);
                index = handleTN3270Commands(data);
                index++;
            }
        }
        return true;
    },

    /**
     * Sends an Attention Key to the mainframe at the given row and column. It also sends the "sendBuffer" that
     * was filled by setText or other inputs. After sending this command, the "sendBuffer" is cleared
     * @param {*} cmd The AID key to send
     * @param {*} row The row on the screen 
     * @param {*} col The column on the screen
     */
    sendCommand: async (cmd,row,col) => {
        if(!cmd.startsWith("[") || !cmd.endsWith("]")) {
            throw new Error("Invalid command, a command just start and end square brackets (i.e. [enter])");
        }
        await waitForUnlock();
        keyboardLocked = true;
        var buffer = [aid.keycodeToHex(cmd)];
        buffer.push(...display.coordinatesToHex(row,col));
        buffer.push(...sendBuffer);

        if(log.isDebugging()) {
            console.log("");
            console.log("HEX Interpretation: ");
            console.log(`${cmd} at (${row},${col})`);
        }

        //precaution where we immediately clear buffer before calling client.write() in case of timing issues where the 
        //buffer could be modified immediately after client.write() which would
        //erase the sendBuffer and ignore data that should be sent to the mainframe
        sendBuffer = []; 
        buffer.push(constants.END_OF_RECORD);
        buffer.push(constants.END_OF_STREAM);
        client.write(Buffer.from(buffer));

        if(log.isDebugging()) {
            // Assuming 'buffer' is a predefined variable containing some binary data
            let bufferInstance = Buffer.from(buffer);

            // Loop through each byte in the buffer and log its hexadecimal value
            for (let byte of bufferInstance) {
                process.stdout.write('0x' + byte.toString(16).toUpperCase().padStart(2, '0') + ' ');
            }
        }
    },

    /**
     * 
     * @param {String} text The text to enter onto the terminal screen
     * @param {Number} row The start row to enter the text
     * @param {Number} col The start colun to enter the text
     */
    setText: (text,row,col) => {
        var field = display.getInputFieldAtPosition(display.coordinatesToPosition(row,col));
        if(!field) {
            console.log(JSON.stringify(field));
            throw new Error(`Cannot set text '${text}' at row ${row} column ${col}. The field is protected.`);
        }
        sendBuffer.push(constants.ORDER_SBA);
        sendBuffer.push(...display.coordinatesToHex(row,col));
        sendBuffer.push(...ctable.toEbcdic(text));
    },

    /**
     * Gets text from the screen based on the given coordinates.
     * @param {Number} row The start row 
     * @param {Number} col The start column
     * @param {Number} length The length of text to extract
     * @returns 
     */
    getText: (row,col,length) => {
        if(row > 24 || row < 1 || col < 1 || col > 80) {
            throw new Error("Invalid row and column (row,col) is out of bounds");
        }
        var displayText = display.getDisplayBuffer().join('');
        var startPos = display.coordinatesToPosition(row,col);
        return displayText.substring(startPos,startPos+length);
    },

    /**
     * Gets the row number that contains the given text. If no match
     * is found, a -1 is returned
     * @param {String} text The text to match
     * @returns {Number} The row number (1 - 24), 
     */
    getRowContainingText: (text,ignoreCase) => {
        var displayText = display.getDisplayBuffer().join('');
        for(var row=1; row < 25; row++) { //for every row in the display buffer
            var startPos = display.coordinatesToPosition(row,1);
            var rowText = displayText.substring(startPos,startPos+80);
            if(ignoreCase) {
                //case insensitive search
                if(rowText.toLowerCase().indexOf(text.toLowerCase()) !== -1) {
                    return row;
                }
            } else {
                //case sensetive search
                if(rowText.indexOf(text) !== -1) {
                    return row;
                }
            }
        }
        return -1;
    },

    /**
     * Detects if text is located anywhere in the current screen buffer
     * @param {String} text The text to search for
     * @param {Boolean} ignoreCase Ignore text case when searching
     * @returns True if the given text is found in the current screen buffer
     */
    hasTextAnywhere: (text,ignoreCase) => {
        if(ignoreCase) {
            return display.getDisplayBuffer().join('').toLocaleLowerCase().indexOf(text.toLowerCase()) == -1;
        }
        return display.getDisplayBuffer().join('').indexOf(text) !== -1;
    },

    /**
     * Waits for the given text to appear in the current screen buffer. We call checkScreen
     * using a different approach so we don't block the main thread of execution so we can 
     * constantly check if the screen buffer is changing and updating behind the scenes.
     * @param {String} text The text to search for in the current screen buffer
     * @param {Boolean} ignoreCase Ignore text case when searching
     * @param {Number} timeout The time in milliseconds to wait for for text before failing
     * @returns A promise
     */
    waitForText: (text,ignoreCase,timeout) => {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();
            const checkScreen = () => {
                const screenText = display.getDisplayBuffer().join('');
                const searchText = ignoreCase ? text.toLowerCase() : text;
                const found = ignoreCase ? screenText.toLowerCase().includes(searchText) : screenText.includes(searchText);
    
                if (found) {
                    resolve();
                } else if (Date.now() - startTime > timeout) {
                    reject(`Timed out waiting for '${text}' to appear on the screen`);
                } else {
                    setTimeout(checkScreen, 10); // Check every 10 milliseconds
                }
            };
            setTimeout(checkScreen, 10); // Check every 10 milliseconds
        });
    },

    /**
     * Waits for the given text to disappear in the current screen buffer. We call checkScreen
     * using a different approach so we don't block the main thread of execution so we can 
     * constantly check if the screen buffer is changing and updating behind the scenes.
     * @param {String} text The text to search for in the current screen buffer
     * @param {Boolean} ignoreCase Ignore text case when searching
     * @param {Number} timeout The time in milliseconds to wait for for text before failing
     * @returns A promise
     */
    waitForNotText: (text,ignoreCase,timeout) => {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();
            const checkScreen = () => {
                const screenText = display.getDisplayBuffer().join('');
                const searchText = ignoreCase ? text.toLowerCase() : text;
                const found = ignoreCase ? screenText.toLowerCase().includes(searchText) : screenText.includes(searchText);
    
                if (!found) {
                    resolve();
                } else if (Date.now() - startTime > timeout) {
                    reject(`Timed out waiting for '${text}' to appear on the screen`);
                } else {
                    setTimeout(checkScreen, 10); // Check every 10 milliseconds
                }
            };
    
            checkScreen();
        });
    },

    /**
     * Get a screen field at the given row and column. This function is often used to get additional
     * information about the host screen, like protected, numeric, and other field attributes for 
     * recognizing the host screen.
     * @param {Number} row The row (inclusive)
     * @param {Number} col The column (inclusive)
     * @returns The screen field at the given row and column. If not found, a null is returned
     */
    getField: (row,col) => {
        return display.getFieldAtPosition(display.coordinatesToPosition(row,col));
    },

    /**
     * This renders a (read only) text display for the terminal. This function waits
     * until the host is ready for input before displaying the screen. The text display
     * also is contained withing a character box to help assist with visualization of the
     * terminal display.
     * @param {Boolean} borderless True if a square border should not be shown around the display
     * @returns A string representing the host screen with line breaks at 80 columns
     */
    getDisplay: async (borderless) => {
        await waitForUnlock();
        if(!borderless) {
            return '\r\n----------------------------------------------------------------------------------'+display.renderTextDisplay(borderless)+'\r\n----------------------------------------------------------------------------------\r\n';
        }
        return display.renderTextDisplay(borderless);
    },

    /**
     * This renders a (read only) text display for the terminal. This function waits
     * until the host is ready for input before displaying the screen
     * @returns A string representing the host screen with line breaks at 80 columns
     */
    getHTMLDisplay: async () => {
        await waitForUnlock();
        return '\r\n'+display.renderHTMLDisplay()+'\r\n';
    },

    /**
     * Sleeps the current thread (used in cases where timing is important). This is typically not required
     * @param {Number} ms The number of milliseconds to pause
     * @returns Promise that is resolved when the timer is finished
     */
    sleep: (ms)=> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

/**
 * While the keyboard is locked (per the specification), we should not allow host interaction
 */
async function waitForUnlock() {
    while(keyboardLocked) {
        log.debug("Waiting for keyboard to be unlocked (WCC restore)");
        await module.exports.sleep(delayTime); //wait time
    }
}

function handleTN3270Commands(data) {
    var curIndex = 0;
    for(;curIndex < data.length; curIndex++) {
        if(commands.process3270Command(data,curIndex)) {
            var wccByte = (data[curIndex+1]).toString(2).padStart(8,'0');
            var options = wcc.processWCC(wccByte);
            if(options.keyboardRestore) {
                keyboardLocked = false;
            }
            curIndex++; //skip wcc byte
            handledCommands = true;
            break;
        }
    }
    return curIndex;
}