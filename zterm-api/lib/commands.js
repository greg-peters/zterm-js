const CONSTANTS = require('./constants');
const wcc = require('./wcc');
const log = require('./debug');
const display = require('./display');

module.exports = {

    process3270Command: (bytes,index) => {
        if(bytes[index] == CONSTANTS.CMD_EAU || bytes[index] == CONSTANTS.SNA_CMD_EAU) {
            log.debug("Command: Erase All Unprotected command");
            return true;
        } else if(bytes[index] == CONSTANTS.CMD_EW || bytes[index] == CONSTANTS.SNA_CMD_EW) {
            log.debug("Command: Erase All / Write");
            //if erasing screen, we may have to change 24x80 to another resolution
            //depending on the new screen being show
            display.eraseWrite();
            var wccByte = (bytes[index+1]).toString(2).padStart(8,'0');
            var options = wcc.processWCC(wccByte);
            if(options.soundAlarm) {
                log.debug("WCC: Sound Alarm");
                process.stdout.write('\u0007');
            }
            if(options.keyboardRestore) {
                log.debug("WCC: Restore Keyboard");
            }
            if(options.resetMDT) {
                log.debug("WCC: Reset MDT");
            }
            if(options.reset) {
                display.reset();
                log.debug("WCC: Reset");
            }
            return true;
        } else if(bytes[index] == CONSTANTS.CMD_EWA || bytes[index] == CONSTANTS.SNA_CMD_EWA) {
            log.debug("Command: Erase All / Write (Alternate)");
            display.erase();
            return true;
        } else if(bytes[index] == CONSTANTS.CMD_NOP) {
            log.debug("Command: No Operation");
            return true;
        } else if(bytes[index] == CONSTANTS.CMD_RB || bytes[index] == CONSTANTS.SNA_CMD_RB) {
            log.debug("Command: Read Buffer");
            return true;
        } else if(bytes[index] == CONSTANTS.CMD_RM || bytes[index] == CONSTANTS.SNA_CMD_RM) {
            log.debug("Command: Read Modified");
            return true;
        } else if(bytes[index] == CONSTANTS.CMD_RMA || bytes[index] == CONSTANTS.SNA_CMD_RMA) {
            log.debug("Command: Read Modified All");
            return true;
        } else if(bytes[index] == CONSTANTS.CMD_W || bytes[index] == CONSTANTS.SNA_CMD_W) {
            log.debug("Command: Write");
            return true;
        } 
        return false;
    }
}