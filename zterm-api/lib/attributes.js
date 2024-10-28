const constants = require("./constants");

module.exports = {

    /**
     * TN3270 Color Codes:
     * input (non-intensified): green
     * input (intensified): red
     * text (intensified): white
     * text (non-intensified): blue
     */

    getFieldAttributes: (attribute) => {
        var result = {};
        result.autoSkip = module.exports.isAutoSkip(attribute);
        result.intensified = module.exports.isIntensifiedDisplay(attribute);
        result.hidden = module.exports.isNonDisplay(attribute);
        result.modified = module.exports.isFieldModified(attribute);
        result.numeric = module.exports.isNumeric(attribute);
        result.protected = module.exports.isProtected(attribute);

        //verify this implementation is accurate (I believe this is based on the TN3270 datastream programmers guide)
        if(attribute === 0b01000000) {
            result.protected = true;
            result.autoSkip = true;
        }
        result.color = calculateColor(result);
        return result;
    },

    /**
     * Sets highlighting for a given field
     */
    setHighlighting: (field,attribute) => {
        if(attribute == constants.HIGHLIGHT_BLINK) {
            field.highlighting = 'blink';
        } else if(attribute == constants.HIGHLIGHT_DEFAULT) {
            field.highlighting = 'default';
        } else if(attribute == constants.HIGHLIGHT_NORMAL) {
            field.highlighting = 'normal';
        } else if(attribute == constants.HIGHLIGHT_REVERSE_VIDEO) {
            field.highlighting = 'reverse video';
        } else if(attribute == constants.HIGHLIGHT_UNDERSCORE) {
            field.highlighting = 'underscore';
        }
    },

    setForeground: (field,attribute) => {
        
    },

    /**
     * True if this field is protected from input, false if this field
     * should be rendered as an input field
     */
    isProtected: (attr) => {
        return (attr & 0b00100000) === 0b00100000;
    },

    /**
     * True if this field is numeric only
     */
    isNumeric: (attr) => {
        return (attr & 0b00010000) === 0b00010000;
    },

    /**
     * True if the character is printable
     */
    isPrintable: (attr) => {
        return (attr & 0b11000000) === 0b11000000;
    },

    /**
     * True if the field should not be displayed on the terminal
     */
    isNonDisplay: (attr) => {
        return (attr & 0b00001100) === 0b00001100;
    },

    /*
    * True if the field should be displayed as intensified
    */
    isIntensifiedDisplay: (attr) => {
        return (attr & 0b00001000) === 0b00001000;
    },

    /**
     * Field has been modified by the terminal user (operator) or by a program in the data stream
     * If the operator changes the field, this field attribute should be changed to a '1'
     * If the operator uses the clear key, all characters in the field buffer should be set to nulls 0x00
     */
    isFieldModified: (attr) => {
        return (attr & 0b00000001) === 0b00000001;
    },

    /**
     * The field should be automatically skipped if the field is tabbed to. 
     */
    isAutoSkip: (attr) => {
        return (attr & 0b00110000) === 0b00110000;
    } 
}

function calculateColor(attribute) {
    if(attribute.protected) {
        return attribute.intensified?"white":"blue";
    } else {
        return attribute.intensified?"red":"green";
    }
}