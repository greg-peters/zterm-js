module.exports = {
    CMD_W:   0x01, /* write */
    CMD_RB:  0x02, /* read buffer */
    CMD_NOP: 0x03, /* no-op */
    CMD_EW:  0x05, /* erase/write */
    CMD_RM:  0x06, /* read modified */
    CMD_EWA: 0x0D, /* erase/write alternate */
    CMD_RMA: 0x0E, /* read modified all */
    CMD_EAU: 0x0F, /* erase all unprotected */
    CMD_WSF: 0x11, /* write structured field */

    SNA_CMD_RMA: 0x6E,	/* read modified all */
    SNA_CMD_EAU: 0x6F,	/* erase all unprotected */
    SNA_CMD_EWA: 0x7E,	/* erase/write alternate */
    SNA_CMD_W:   0xF1,	/* write */
    SNA_CMD_RB:  0xF2,	/* read buffer */
    SNA_CMD_WSF: 0xF3,	/* write structured field */
    SNA_CMD_EW:	 0xF5,	/* erase/write */
    SNA_CMD_RM:	 0xF6,	/* read modified */

    ORDER_PT:	 0x05,	/* program tab */
    ORDER_GE:	 0x08,	/* graphic escape */
    ORDER_SBA:	 0x11,	/* set buffer address */
    ORDER_EUA:	 0x12,	/* erase unprotected to address */
    ORDER_IC:	 0x13,	/* insert cursor (decimal 19)*/
    ORDER_SF:	 0x1D,	/* start field */
    ORDER_SA:	 0x28,	/* set attribute */
    ORDER_SFE:	 0x29,	/* start field extended */
    ORDER_YALE:	 0x2B,	/* Yale sub command */
    ORDER_MF:	 0x2C,	/* modify field */
    ORDER_RA:	 0x3C,	/* repeat to address */

    /**
     * 
     * Reference: Page 4-18 of the 3270_Data_Stream_Programmers_Reference_Dec88.pdf
     * 
     * SFE Attributes
     * 
     * Reset All Attribute Types (0x00)
     * The attribute type 0x00 may appear only in the SA order (Not SFE)
     * 
     * 3270 Field Attribute (0xC0)
     */
    FIELD_ATTRIBUTE: 0xC0,
     /* 
     * 
     * Highlighting (0x41)
     * --------------------------------------------------
     */

    HIGHLIGHT_ATTRIBUTE: 0x41,
    HIGHLIGHT_DEFAULT: 0X00,
    HIGHLIGHT_NORMAL:  0XF0, /** as determined by the 3270 field attribute */
    HIGHLIGHT_BLINK:   0XF1,
    HIGHLIGHT_REVERSE_VIDEO: 0XF2,
    HIGHLIGHT_UNDERSCORE: 0xF4,

     /* Foreground Color (0x42) or Background Color (0x45)
     * --------------------------------------------------
     * 0x00 Default color (defined by Query Reply [Color])
     * 0xF7 Neutral
     * All other colors as indicated by Query Reply (Color)
     * 
     * Character Set (0x43)
     * --------------------------------------------------
     * 0x00         Default character set
     * 0x40 - 0xEF  Local ID for loadable character sets
     * 0xF0 - 0xF7  Local ID for nonloadable character sets
     * 0xF8 - 0xFE  Local ID for 2 byte coded character sets
     * 
     * Field Outlining (0xC2)
     * --------------------------------------------------
     */
    NO_OUTLINING_LINES:         0B00000000,
    UNDERLINE_ONLY:             0B00000001,
    RIGHT_VERTICAL_LINE_ONLY:   0B00000010,
    OVERLINE_ONLY:              0B00000100,
    LEFT_VERTICAL_LINE_ONLY:    0B00001000,
    UNDERLINE_RIGHT_VERTICAL:   0B00000011,
    UNDERLINE_OVERLINE:         0B00000101,
    RIGHT_VERTICAL_OVERLINE:    0B00000110, 
    RIGHT_LEFT_VERTICAL:        0B00001010,
    OVERLINE_LEFT_VERTICAL:     0B00001100,
    RECT_MINUS_LEFT_VERTICAL:   0B00000111,
    RECT_MINUS_OVERLINE:        0B00001011,
    RECT_MINUS_RIGHT_VERTICAL:  0B00001101,
    RECT_MINUS_UNDERLINE:       0B00001110,
    RECT:                       0B00001111,

    AID_NO_AID_GENERATED: 0x60,
    AID_NO_AID_GENERATED_PRINTER_ONLY: 0xE8,
    AID_STRUCTURED_FIELD: 0x88,
    AID_READ_PARTITION: 0x61, /** Can never be used as the first byte for the inbound datastream */
    AID_TRIGGER_ACTION: 0x7F,
    AID_SYS_REQ: 0xF0,
    AID_PF1: 0xF1,
    AID_PF2: 0xF2,
    AID_PF3: 0xF3,
    AID_PF4: 0xF4,
    AID_PF5: 0xF5,
    AID_PF6: 0xF6,
    AID_PF7: 0xF7,
    AID_PF8: 0xF8,
    AID_PF9: 0xF9,
    AID_PF10: 0x7A,
    AID_PF11: 0x7B,
    AID_PF12: 0x7C,
    AID_PF13: 0xC1,
    AID_PF14: 0xC2,
    AID_PF15: 0xC3,
    AID_PF16: 0xC4,
    AID_PF17: 0xC5,
    AID_PF18: 0xC6,
    AID_PF19: 0xC7,
    AID_PF20: 0xC8,
    AID_PF21: 0xC9,
    AID_PF22: 0x4A,
    AID_PF23: 0x4B,
    AID_PF24: 0x4C,
    AID_PA1: 0x6C,
    AID_PA2: 0x6E, /** CNCL **/
    AID_PA3: 0x6B,
    AID_CLEAR: 0x6D,
    AID_CLEAR_PARTITION: 0x6A,
    AID_ENTER: 0x7D,
    AID_SELECTOR_PEN: 0x7E,
    AID_MAGNETIC: 0xE6,
    AID_MAGNETIC_READER_NUMBER: 0xE7,

    END_OF_RECORD: 0xFF, /* end of record (dec 255) */
    END_OF_STREAM: 0xEF /* end of datastream (dec 239)*/
};