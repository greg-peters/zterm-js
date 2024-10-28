/**
 * This file handles the Write Control Charater WCC byte to interpret the contents
 * of the associated byte. All functions of this file require
 * a binary string representation of the WCC byte. i.e. '01011011'
 * RESET:           0100 0000
 * START_PRINTER:   0000 1000
 * SOUND_ALARM:     0000 0100
 * KEYBOARD_RESTORE:0000 0010
 * RESET_MDT:       0000 0001
 */
module.exports = {
 
    /**
     * If the WCC byte has the reset bit set
     */
    resetBit: (wcc) => {
        return wcc.charAt(1) == '1';
    },

    /**
     * If the WCC byte has the start printer bit set
     */
    startPrinter: (wcc) => {
        return wcc.charAt(4) == '1';
    },

    /**
     * If the WCC byte has the sound alarm bit set
     */
    soundAlarm: (wcc) => {
        return wcc.charAt(5) == '1';
    },

    /**
     * If the WCC byte has the keyboard restore bit set
     */
    keyboardRestore: (wcc) => {
        return wcc.charAt(6) == '1';
    },

    /**
     * If the WCC byte has the modified data tag (MDT) bit set
     */
    resetMDT: (wcc) => {
        return wcc.charAt(7) == '1';
    },

    /**
     * Process the WCC byte and return result
     */
    processWCC: (wcc) => {
        var result = {};
        result.reset = module.exports.resetBit(wcc);
        result.startPrinter = module.exports.startPrinter(wcc);
        result.soundAlarm = module.exports.soundAlarm(wcc);
        result.keyboardRestore = module.exports.keyboardRestore(wcc);
        result.resetMDT = module.exports.resetMDT(wcc);
        return result;
    }
}