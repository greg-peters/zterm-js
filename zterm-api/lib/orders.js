const CONSTANTS = require('./constants');
const display = require('./display');
const log = require('./debug');

module.exports = {

    processOrders: (data) => {
        for(var i=0;i < data.length; i++) {
            if(data[i] == CONSTANTS.ORDER_SF) { //start of new field
                if(i + 1 < data.length) {
                    display.startField(data[i+1]);
                    var coordinates = display.positionToCoordinates(display.getPosition());
                    log.debug(`\r\nStartField(${coordinates.row},${coordinates.col})\r\nAttributes(${JSON.stringify(display.getCurrentField().attributes)})\r\n`);
                    i+=1; //skip field attribute byte
                } else {
                    log.debug("\r\nStart Field (SF) order was found but no field attribute byte follows\r\n");
                }
            } else if(data[i] == CONSTANTS.ORDER_SBA) {
                if(i + 1 < data.length && i + 2 < data.length) {
                    display.setBufferAddress(data[i+1],data[i+2]);
                    var coordinates = display.positionToCoordinates(display.getPosition());
                    log.debug(`\r\nSetBufferAddress(${coordinates.row},${coordinates.col})\r\n`);
                    i += 2; //skip 2 byte address
                } else {
                    log.debug("\r\nSet Display Buffer Address (SBA) order was found but insufficient bytes for address\r\n");
                }
            } else if(data[i] == CONSTANTS.ORDER_IC) {
                var coordinates = display.positionToCoordinates(display.getPosition());
                log.debug(`\r\nInsertCursor(${coordinates.row},${coordinates.col})\r\n`);
                display.insertCursor();
            } else if(data[i] == CONSTANTS.ORDER_RA) {
                if(i + 1 < data.length && i + 2 < data.length && i + 3 < data.length) {
                    if(log.isDebugging()) {
                        var coordinates = display.positionToCoordinates(display.getPosition());
                        var endPos = display.hexToPosition(data[i+1],data[i+2]);
                        var endCoordinates = display.positionToCoordinates(endPos);
                        log.debug(`\r\nRepeatToAddress (${coordinates.row},${coordinates.col}) to (${endCoordinates.row},${endCoordinates.col}) Char: '${display.hexToString(data[i+3])}'\r\n`);
                    }
                    display.repeatToAddress(data[i+1],data[i+2],data[i+3]);
                    i+=3; //skip the 2 address bytes and the char byte
                } else {
                    log.debug("\r\nRepeat Address (RA) order was found but insufficient bytes for operation\r\n");
                }
            } else if(data[i] == CONSTANTS.END_OF_STREAM) {
                display.endOfStream();
                log.debug("\r\nEnd of stream was detected\r\n");
                if(i < data.length-1) {
                    return i; //return the next index to process
                } else {
                    return -1; //-1 means FINAL end of stream
                }
            } else if(data[i] == CONSTANTS.END_OF_RECORD) { 
                display.endOfRecord();
                log.debug("\r\nEnd of record was detected\r\n");
            } else if(data[i] == CONSTANTS.ORDER_PT) {
                var coordinates = display.positionToCoordinates(display.getPosition());
                log.debug(`\r\nProgramTab from (${coordinates.row},${coordinates.col})\r\n`);
                display.programTab();
            } else if(data[i] == CONSTANTS.ORDER_EUA) {
                display.eraseUnprotectedToAddress(data[i+1],data[i+2]);
                i+=2; //skip the 2 address bytes
                log.debug("\r\nErase Unprotected To Address was detected in orders\r\n");
            } else if(data[i] == CONSTANTS.ORDER_GE) {
                i+=1; //skip code points (0x40 through 0xFE are valid graphic characters codes)
                log.debug("\r\nGraphics Escape detected in order\r\n");
                //we are currently ignoring based on the IBM specification, unless we want to implement it later
            } else if(data[i] == CONSTANTS.ORDER_SA) {
                log.debug("\r\nOrder: Set Attribute (ignored)\r\n");
                display.setAttribute(data[i+1],data[i+2]);
                i+=2;
            } else if(data[i] == CONSTANTS.ORDER_SFE) {
                var pairs = data[i+1]; //how many attribute pairs that we read
                //i+1+(2*{number of pairs})
                var attributePairs = [];
                for(var idx=0; idx < pairs; idx++) { //for every field attribute pair
                    attributePairs.push(data[(i+1) + (idx*2 + 1)]); //attribute type
                    attributePairs.push(data[(i+1) + (idx*2 + 2)]); //attribute value
                }
                display.startFieldExtended(attributePairs);
                log.debug("\r\nStart Field Extended was found\r\n");
                i+=(1+(2*pairs)); //advance data pointer by the number of pairs field and the total number of actual pairs
            } else {
                if(log.isDebugging()) {
                    process.stdout.write(`'${display.hexToString(data[i])}'`);
                }
                display.write(data[i]);
            }
        }
    }
}