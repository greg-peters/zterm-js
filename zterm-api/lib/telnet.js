const log = require('./debug');

const IAC = 0xFF;
const DONT = 0xFE;
const DO = 0xFD;
const SNB = 0xFA;
const WILL = 0xFB;
const WONT = 0xFC;
const SNE = 0xF0;
const TN3270E = 0x28;
const EOR = 0x19;
const BINARY = 0x00;
const IS = 0x00;
const WINDOW_SIZE = 0x1F;
const REMOTE_FLOW_CONTROL = 0x21;
const LINE_MODE = 0x22;
const SUPRESS_GO_AHEAD = 0x03;
const ECHO = 0x01;
const STATUS = 0x05;
const LINE_WIDTH = 0x08;
const TIMING_MARK = 0x06;
const TERMINAL_TYPE = 0x18;

//TN3270E Parameters
const TN3270E_ASSOCIATE = 0;
const TN3270E_CONNECT = 1;
const TN3270E_DEVICE_TYPE = 2;
const TN3270E_FUNCTIONS = 3;
const TN3270E_IS = 4;
const TN3270E_REASON = 5;
const TN3270E_REJECT = 6;
const TN3270E_REQUEST = 7;
const TN3270E_SEND = 8;
const TN3270E_BIND_IMAGE = 0;
const TN3270E_DATA_STREAM_CTL = 1;
const TN3270E_RESPONSES = 2;
const TN3270E_SCS_CTL_CODES = 3;
const TN3270E_SYSREQ = 4;
const TN3270E_CONT_RESOLUTION = 5;

/**
        Server:  IAC DO TN3270E
        Client:  IAC WILL TN3270E
        Server:  IAC SB TN3270E SEND DEVICE-TYPE IAC SE
        Client:  IAC SB TN3270E DEVICE-TYPE REQUEST IBM-3278-2 IAC SE
        Server:  IAC SB TN3270E DEVICE-TYPE IS IBM-3278-2 CONNECT
                        anyterm IAC SE
        Client:  IAC SB TN3270E FUNCTIONS REQUEST RESPONSES IAC SE
        Server:  IAC SB TN3270E FUNCTIONS IS RESPONSES IAC SE
           (3270 data stream is exchanged)
 */

module.exports = {

    /**
     * Detect and handle telnet commands. Note, all telnet commands
     * are in ASCII format, they only convert to EBCDIC after negotiation
     * is complete
     * @returns True if telnet handled a negotiation command
     */
    handleNegotiation: (data,client) => {
        if(data.length > 1 && data[0] == 0xFF) {
            var response = module.exports.handleCommand(data);
            if(response && response[0] == 0xFF) {
                client.write(response);
                return true;
            }
        }
        return false;
    },

    handleCommand: (buffer) => {
        if(buffer.length <= 1) {
            throw new Error("Buffer length recieved is less than or equal to 1");
        }
        if(buffer[1] == DO) {
            log.debug(`Server responded with DO command`);
            return module.exports.handleDoCommand(buffer.slice(2));
        } else if(buffer[1] == SNB) {
            log.debug(`Server responded with SNB for sub negotiation`);
            return module.exports.handleSubNegotiation(buffer.slice(2));
        } else if(buffer[1] == DONT) {
            log.debug(`Server responded with DONT ${buffer[2]}`);
        } else if(buffer[1] == WONT) {
            log.debug(`Server responded with DONT ${buffer[2]}`);
        } else if(buffer[1] == WILL && buffer[2] == EOR) {
            return Buffer.from([IAC, DO, EOR]);
        } else {
            log.debug(`Unable to handle IAC ASCII command 0x${buffer[1]}`);
        }
    },

    handleDoCommand: (buffer) => {
        if(buffer[0] == TERMINAL_TYPE) {
            log.debug("Handling Terminal Type");
            return Buffer.from([IAC,WILL,TERMINAL_TYPE]);
        } else if(buffer[0] == EOR && buffer[1] == IAC && buffer[2] == WILL && buffer[3] == EOR) {
            log.debug("Handling WILL EOR");
            return Buffer.from([IAC, WILL, EOR, IAC, DO, EOR]);
        } else if(buffer[0] == BINARY && buffer[1] == IAC && buffer[2] == WILL && buffer[3] == BINARY) {
            log.debug("Handling BINARY");
            return Buffer.from([IAC, WILL, BINARY, IAC, DO, BINARY]);
        } else if(buffer[0] == TN3270E) {
            log.debug("Handling TN3270E");
            return Buffer.from([IAC, WONT, TN3270E]);
        } else if(buffer[0] == EOR) {
            log.debug("Handling EOR");
            return Buffer.from([IAC, WILL, EOR]);
        } else if(buffer[0] == TIMING_MARK) {
            log.debug("Handling TIMING_MARK");
            return Buffer.from([IAC, WONT, TIMING_MARK]);
        } else {
            log.debug(`Cannot handle do command: 0x${buffer.toString('hex')}`);
        }
    },

    handleSubNegotiation: (buffer) => {
        if(buffer[0] == WINDOW_SIZE) {
            log.debug("negotiating window size");
            //8024 = 80 columns 24 rows
            return Buffer.from([IAC,SNB,WINDOW_SIZE, IS, 0x38, 0x30, 0x32, 0x34,IAC, SNE]);
        } else if(buffer[0] == TERMINAL_TYPE) {
            log.debug("negotiating terminal type");
            //IBM-3278-2
            //if LUNAME, implement CONNECT,LUNAME,IAC,SNE on the end 
            //where LUNAME is in ASCII hex (not EBCDIC because we're not established with TN3270 protocol yet)
            //this would be implemented as ...,TN3270E_CONNECT,<LUNAME>,IAC,SNE]); on the buffer below this line (Not sure if this works on TN3270 because it might only work on TN3270E)
            return Buffer.from([IAC, SNB, TERMINAL_TYPE, IS, 0x49, 0x42, 0x4D, 0x2D, 0x33, 0x32, 0x37, 0x38 ,0x2D, 0x32,IAC,SNE]); 
        } else if(buffer[0] == TN3270E) { //TN3270 negotiation section
            log.debug("negotiating TN3270E");
            if(buffer[1] == TN3270E_SEND && buffer[2] == TN3270E_DEVICE_TYPE) {
                log.debug("negotiating SEND device type");
                //LUNAME logic would be implemented as ...,TN3270E_CONNECT,<LUNAME>,IAC,SNE]); on the buffer below this line as well.
                return Buffer.from([IAC, SNB, TN3270E, TN3270E_DEVICE_TYPE, TN3270E_REQUEST, 0x49, 0x42, 0x4D, 0x2D, 0x33, 0x32, 0x37, 0x38 ,0x2D, 0x32, IAC, SNE]);
            } else if(buffer[1] == TN3270E_DEVICE_TYPE && buffer[2] == TN3270E_IS) {
                //console.log("Terminal set to IBM-3278-4-E")
                //TODO extract anyterm from server response
                //return Buffer.from([IAC,DO,0x12,IAC, SNE]);
                //returns a request for responses to get the TN3270 Datastream
                return Buffer.from([IAC,SNB,TN3270E,TN3270E_FUNCTIONS, TN3270E_REQUEST, TN3270E_RESPONSES, TN3270E_SYSREQ, IAC, SNE]);
                //return Buffer.from([IAC,WILL,TERMINAL_TYPE]);
            } else if(buffer[1] == TN3270E_FUNCTIONS && buffer[2] == TN3270E_IS) {
                log.debug(buffer);
                // console.log("Negotiating window size");
                //return null;
                //return Buffer.from([0x88,0x7D,0x13,0x03]); //send 0x88 [enter], row 19, col 3???
                //return Buffer.from([IAC,WILL,WINDOW_SIZE]);
                return null;
            } else {
                log.debug(`TN3270E command is not implemented 0x${buffer[1].toString('hex')}`);
                return null;
            }
        } else {
            log.debug("Sub negotiation not handled");
            return null;
        }
    }
}