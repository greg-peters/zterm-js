const conv = require('./ctable');
const attributes = require('./attributes');
const log = require('./debug');
const constants = require('./constants');

const positionHex = [
    0x40, 0xC1, 0xC2, 0xC3, 0xC4, 0xC5, 0xC6, 0xC7,
    0xC8, 0xC9, 0x4A, 0x4B, 0x4C, 0x4D, 0x4E, 0x4F,
    0x50, 0xD1, 0xD2, 0xD3, 0xD4, 0xD5, 0xD6, 0xD7,
    0xD8, 0xD9, 0x5A, 0x5B, 0x5C, 0x5D, 0x5E, 0x5F,
    0x60, 0x61, 0xE2, 0xE3, 0xE4, 0xE5, 0xE6, 0xE7,
    0xE8, 0xE9, 0x6A, 0x6B, 0x6C, 0x6D, 0x6E, 0x6F,
    0xF0, 0xF1, 0xF2, 0xF3, 0xF4, 0xF5, 0xF6, 0xF7,
    0xF8, 0xF9, 0x7A, 0x7B, 0x7C, 0x7D, 0x7E, 0x7F
]

const textColors = {
    red: '\x1b[31m',
    black: '\x1b[30m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    gray: '\x1b[90m'
}

const backgroundColors = {
    black: '\x1b[40m',
    red: '\x1b[41m',
    green: '\x1b[42m',
    yellow: '\x1b[43m',
    blue: '\x1b[44m',
    magenta: '\x1b[45m',
    cyan: '\x1b[46m',
    white: '\x1b[47m',
    gray: '\x1b[100m'
};

var displayBuffer = Array(1920).fill(' ');
var position = 0;
var cursorPosition = 0;
var fields = [];
var currentField = null;

module.exports = {

    getCursorPosition: ()=> {
        return module.exports.positionToCoordinates(cursorPosition);
    },

    /**
     * Get the raw display buffer. This will return a shallow copy of the display
     * buffer so the caller of this function cannot manipulate the raw display
     */
    getDisplayBuffer: ()=> {
        return [...displayBuffer];
    },

    /**
     * Get the current display buffer index position
     * @returns Buffer index position
     */
    getPosition: ()=> {
        return position;
    },

    eraseWrite: ()=> {
        displayBuffer.fill(' ');
        cursorPosition = 0;
        currentField = null;
        position = 0;
        fields = []; //erase all fields
    },

    reset: ()=> {
        cursorPosition = 0;
        position = 0;
        currentField = null;
        fields = []; //reset fields
    },

    startField: (fieldAttributeByte)=> {
        if(currentField !== null) {
            //if the current position is less that the last field's start position, this means the screen was wrapped so we set it to the end of the screen (1919)
            var endPosition = position < currentField.startPosition?1919:position;
            currentField.endPosition = endPosition; //the end position and endRow/endCol are exclusive and do that exactly end at the given end position (it ends 1 position less than the given end position)
            var ecoordinates = module.exports.positionToCoordinates(currentField.endPosition);
            currentField.endRow = ecoordinates.row;
            currentField.endCol = ecoordinates.col;
            currentField.text = displayBuffer.slice(currentField.startPosition,currentField.endPosition).join('');
            fields.push(currentField);
        }
        if(position >= 1919) {
            position = 0; //if position is end of screen, we move the buffer to the top left corder of the screen
        }
        // var fieldAttribute = fieldAttributeByte.toString(2).padStart(8,'0');
        currentField = {};
        currentField.startPosition = position; //inclusive
        //field attributes always take up 1 blank space on the screen
        //a write will advance the buffer position by 1
        module.exports.write(0x40); 
        var scoordinates = module.exports.positionToCoordinates(currentField.startPosition);
        currentField.startRow = scoordinates.row;
        currentField.startCol = scoordinates.col;
        currentField.attributes = attributes.getFieldAttributes(fieldAttributeByte);
    },

    /**
     * Get the current field that is being processed by the display
     */
    getCurrentField: ()=> {
        return currentField;
    },

    /**
     * Get a screen field based on a linear position. If the linear position specified
     * falls inside the screen area of a field (inclusive), the field will be returned.
     * If the linear position falls outside any field position (off screen), null will
     * be returned.
     * @param {Number} position The linear position 0-1919 to get a field on the screen 
     * @returns The screen field or null if not found
     */
    getFieldAtPosition: (position) => {
        var results = []
        var reversedFields = [...fields].reverse();
        for(var field of reversedFields) { //look for the last field that matches first, in case the field is overwritten by an erase screen
            if(field.startPosition <= position && position < field.endPosition) {
                results.push(field);
            }
        }
        if(results.length > 0) {
            return results[0];
        } else {
            return null;
        }
    },

    /**
     * Gets the input field at the given position. It returns the most up-to-date input field that is contained within the
     * given position
     * @param {Number} position Linear position on screen 
     * @returns Null or input field
     */
    getInputFieldAtPosition: (position) => {
        var results = []
        var reversedFields = [...fields].reverse();
        for(var field of reversedFields) { //look for the last field that matches first, in case the field is overwritten by an erase screen
            if(field.startPosition <= position && position < field.endPosition && !field.attributes.protected) {
                results.push(field);
            }
        }
        if(results.length > 0) {
            //returns the first input field that matches based on most recent display update
            return results[0];
        } else {
            return null;
        }
    },

    /**
     * Set the display buffer address to the given hex position. Note, the
     * give 2 bytes represent 1 linear integer position in the display buffer
     * @param {Number} byte1 The first hex byte of the position address
     * @param {Number} byte2 The second hex byte of the position address
     */
    setBufferAddress: (byte1,byte2)=> {
        position = module.exports.hexToPosition(byte1,byte2);
    },

    /**
     * Start an extended field with the given field attribute pairs.
     * For example: Only one pair of attributes would be = [attributeType1,attributeValue1]
     * If 2 attribute pairs are given the array would be [attributeType1,attributeValue1,attributeType2,attributeValue2]
     * @param {Array} attributePairs 
     */
    startFieldExtended: (attributePairs) => {
        var currentField = {};
        if(attributePairs.length == 0) {
            //use defaults for field
        }
        for(var i=0;i < attributePairs.length; i+=2) {
            var attributeType = attributePairs[i];
            var attributeValue = attributePairs[i+1];
            if(attributeType == constants.FIELD_ATTRIBUTE) { //3270 Field attribute definition
                currentField.attributes = attributes.getFieldAttributes(fieldAttribute);
            } else if(attributeType == constants.HIGHLIGHT_ATTRIBUTE) {
                currentField.attributes.highlight = attributeValue;
            }
        }
    },

    setAttribute: (byte1,byte2) => {
        if(currentField) {
            //byte1 is type & byte2 is value of attribute
        }
        throw new Error("SetAttribute Order Not Implemented");
    },

    eraseUnprotectedToAddress: (endPosition)=> {
        var currentBufferAddress = position;
        //loop through all input fields starting at position 0, if 
        //input field found, place 0x00 in each buffer location

        throw new Error("EraseUnprotectedToAddress Not Implemented");
    },

    eraseAllUnprotected: ()=> {
        
        //loop through all input fields, if input field found,
        //get position and length and erase all values
        //in the input field
        throw new Error("EraseAllUnprotected Not Implemented");
    },

    programTab: ()=> {
        //start at the next position in the buffer and find the next field that is unprotected
        for(var i=position+1; i < 24*80; i++) {
            var field = module.exports.getFieldAtPosition(i);
            if(field && !field.attributes.protected) {
                position = startPosition;
                return;
            }
        }
        position = 0;
    },

    /**
     * This function inserts the given EDCDIC hex char into the
     * display buffer from the current display position(inclusive) to
     * the end position(exclusive, denoted by 2 bytes combined together in 12-bit form)
     * @param {*} byte1 The first byte end position to stop inserting the char (exclusive)
     * @param {*} byte2 The second byte end position to stop inserting the char (exclusive)
     * @param {*} char The EBCDIC hex code to insert into the display buffer
     */
    repeatToAddress: (byte1,byte2,char)=> {
        var endPos = module.exports.hexToPosition(byte1,byte2);
        //if the end position is 0, this means the rest of the screen is erased or filled with the repeat character
        if(endPos == 0) {
            endPos = 1919;
        }
        for(var i=position;i < endPos; i++) {
            displayBuffer[i] = module.exports.hexToString(char);
        }
        position = endPos;
    },

    /**
     * This function sets the cursor on the display to the current
     * display buffer position.
     */
    insertCursor: ()=> {
        cursorPosition = position;
    },

    /**
     * Write a character to the display buffer at the current position
     * @param {Number} char Hex byte in EBCDIC form to write to the display buffer 
     */
    write: (char)=> {
        displayBuffer[position] = module.exports.hexToString(char);
        position++;
    },

    /**
     * This function finalizes any pending field when the TN3270
     * datastream has ended.
     */
    endOfRecord: ()=> {
        module.exports._finalizeField();
        position = 0; //reset position on screen
        cursorPosition = 0; //reset cursor position
        currentField = null; //reset field 
    },

    /**
     * This function is called when the end of stream byte
     * is encountered in the TN3270 datastream
     */
    endOfStream: ()=> {
        //implement as needed
    },

    /**
     * This will terminate the last field to the end of the screen. This is required logic.
     * 
     */
    _finalizeField: ()=> {
        if(currentField !== null) {
            position = 1919; //extend the field to the last position on the screen
            currentField.endPosition = position; 
            var ecoordinates = module.exports.positionToCoordinates(currentField.endPosition);
            currentField.endRow = ecoordinates.row;
            currentField.endCol = ecoordinates.col;
            if(currentField.startPosition <= cursorPosition && currentField.endPosition >= cursorPosition) {
                currentField.attributes.protected = false;
                currentField.hasCursor = true;
            }
            currentField.text = displayBuffer.slice(currentField.startPosition,currentField.endPosition).join('');
            fields.push(currentField);
            currentField = null; //reset to null
        }
    },

    resetColors: ()=> {
        process.stdout.write('\x1b[0m');
    },

    setTextColor: (color) => {
        process.stdout.write(textColors[color]);
    },

    setBackgroundColor: (color) => {
        process.stdout.write(backgroundColors[color]);
    },

    /**
     * This function takes a zero index linear position and converts it to two EBCDIC hex values
     * that represent an address in the display buffer. This function is used when you want
     * to take a linear position on the screen and convert it to a 2 byte hex address before
     * sending it back to the mainframe for processing.
     * 
     * @param {Number} position The linear position in the display buffer
     */
    positionToHex: (position) => {
        if (position < 0 || position > 1919) {
            throw new Error("Position out of range");
        }
        //remove the bottom 6 bits by shifting right 6, then take the bottom 6 bits (b/c these are 12 bit numbers)
        const byte1 = positionHex[(position >> 6) & 0x3F];
        //take the bottom 6 bits for the second hex value
        const byte2 = positionHex[position & 0x3F];    
        return [byte1, byte2];
    },


    /**
     * This function returns what value the position within the display should be set to.
     * H1 & H2 are the 2 address bytes that directly follow a SBA order from the TN3270 datastream.
     */
    hexToPosition: (hex1, hex2) => {
        let address;
        if ((hex1 & 0xC0) === 0x00) { //if true, 14 bit binary address follows
          address = ((hex1 & 0x3F) << 8) | hex2; //take bottom 6 bits and combine them with all 8 bits of C2
        } else {
          address = ((hex1 & 0x3F) << 6) | (hex2 & 0x3F); //take bottom 6 bits of C1 and shift to make 1100 0000, then combine then with bottom 6 bits of C2
        }
        return address;
    },

    /**
     * This function take 2 row & column coordinates and converts them to two EBCDIC hex values.
     * These hex value are used by the host application to detemine where to position
     * the buffer location
     * @param {Number} row The row to encode
     * @param {Number} col The col to encode
     */
    coordinatesToHex: (row,col) => {
        var position = module.exports.coordinatesToPosition(row,col);
        return module.exports.positionToHex(position);
    },

    /**
     * This function converts row & column coordinates to a linear position. The linear
     * position always starts at index 0
     * @param {Number} row 
     * @param {Number} col 
     * @returns The linear position
     */
    coordinatesToPosition: (row,col) => {
        if (row < 1 || row > 24 || col < 1 || col > 80) {
            throw new Error("Row or column out of range");
        }
        return (row - 1) * 80 + (col - 1);
    },

    /**
     * This function converts a 0 index linear position to a row & column coordinates.
     * @param {Number} position The 0 index position
     * @returns {Object} The row and colun
     */
    positionToCoordinates: (position) => {
        if (position < 0 || position > 1919) {
          throw new Error(`Position out of range: ${position}`);
        }
        const row = Math.floor(position / 80) + 1;
        const col = (position % 80) + 1;
        return {row:row, col:col};
    },

    bytesToHex: (byte) => {
        if (Array.isArray(byte)) {
          return byte.map((val) => {
            return `0x${val.toString(16).toUpperCase().padStart(2, '0')}`;
          });
        } else {
          return `0x${byte.toString(16).toUpperCase().padStart(2, '0')}`;
        }
    },

    stringToHex: (str) => {
        var bytes = [];
        for(var c of [...str]) {
            bytes.push(module.exports.charToHex(c));
        }
        return bytes;
    },

    hexToString: (bytes) => {
        if(Array.isArray(bytes)) {
            return bytes.map((val) => {
                return String.fromCharCode(conv.toAsciiChar(val));
            }).join('');            
        } else {
            return String.fromCharCode(conv.toAsciiChar(bytes));
        }
    },

    charToHex: (c) => {
        return conv.toEbcdicChar(c);
    },

    renderTextDisplay: (borderless) => {
        var display = "";
        for(var i=0;i < displayBuffer.length; i++) {
            if(i % 80 == 0) {
                if(!borderless) {
                    display += (i !== 0 ? '|\r\n' : '\r\n') + '|';
                } else {
                    display += '\r\n';
                }
            }
            var field = module.exports.getFieldAtPosition(i);
            if(field && field.attributes.hidden) {
                display = display.concat(' ');
            } else {
                display = display.concat(displayBuffer[i]);
            }
        }
        if(!borderless) {
            display +='|';
        }
        return display;
    },

    renderHTMLDisplay: () => {
        var display = "";
        for(var i=0;i < displayBuffer.length; i++) {
            if(i % 80 == 0) {
                display = display.concat('\r\n');
            }
            var field = module.exports.getFieldAtPosition(i);
            if(field) {
                if(!field.attributes.protected) {
                    var input = module.exports.renderInputField(i,field);
                    display = display.concat(input.html);
                    i = input.lastIndex;
                    //render input field
                } else {
                    if(field.attributes.hidden) {
                        display = display.concat(' ');
                    } else {
                        display = display.concat(displayBuffer[i]);
                    }
                }
            } else {
                display = display.concat(displayBuffer[i]);
            }
        }
        return display;
    },

    renderInputField: (index,field) => {
        var inputValue = '';
        var inputHTML = '';
        var lastIndex = index;
        for(var i=index;i < displayBuffer.length; i++) {
            if(i == field.endPosition) {
                inputValue = inputValue.concat(displayBuffer[i]);
                inputHTML = inputHTML.concat(`<input type='text' name='field_${field.startPosition}' style='width: ${inputValue.length}ch;${field.attributes.intensified?'color:red':'color: yellowgreen'}' maxLength="${inputValue.length}" value='${!field.attributes.hidden?inputValue:''}'${field.hasCursor?' autofocus':''}>`);
                inputValue = '';
                lastIndex = i;
                break;
            } else if(i > 0 && i % 80 == 0) {
                    inputHTML = inputHTML.concat(`<input type='text' name='field_${field.startPosition}' style='width: ${inputValue.length}ch;${field.attributes.intensified?'color:red':'color: yellowgreen'}' maxLength="${inputValue.length}" value='${!field.attributes.hidden?inputValue:''}'${field.hasCursor?' autofocus':''}>\r\n`);
                    inputValue = displayBuffer[i];
            } else {
                inputValue = inputValue.concat(displayBuffer[i]);
            }
        }
        return {html: inputHTML,lastIndex: lastIndex};
    }
}