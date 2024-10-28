const constants = require('./constants');

module.exports = {

    keycodeToHex: (keycode) => {
        return conversionTable[keycode.toLowerCase()];
    }
}

const conversionTable = {
    '[noaid]': constants.AID_NO_AID_GENERATED,
    '[clear]': constants.AID_CLEAR,
    '[clear_partition]': constants.AID_CLEAR_PARTITION,
    '[enter]': constants.AID_ENTER,
    '[pf1]': constants.AID_PF1,
    '[pf2]': constants.AID_PF2,
    '[pf3]': constants.AID_PF3,
    '[pf4]': constants.AID_PF4,
    '[pf5]': constants.AID_PF5,
    '[pf6]': constants.AID_PF6,
    '[pf7]': constants.AID_PF7,
    '[pf8]': constants.AID_PF8,
    '[pf9]': constants.AID_PF9,
    '[pf10]': constants.AID_PF10,
    '[pf11]': constants.AID_PF11,
    '[pf12]': constants.AID_PF12,
    '[pf13]': constants.AID_PF13,
    '[pf14]': constants.AID_PF14,
    '[pf15]': constants.AID_PF15,
    '[pf16]': constants.AID_PF16,
    '[pf17]': constants.AID_PF17,
    '[pf18]': constants.AID_PF18,
    '[pf19]': constants.AID_PF19,
    '[pf20]': constants.AID_PF20,
    '[pf21]': constants.AID_PF21,
    '[pf22]': constants.AID_PF22,
    '[pf23]': constants.AID_PF23,
    '[pf24]': constants.AID_PF24,
    '[pa1]': constants.AID_PA1,
    '[pa2]': constants.AID_PA2,
    '[pa3]': constants.AID_PA3
}