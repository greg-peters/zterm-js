var debugging = false;

module.exports = {

    enable: () => {
        debugging = true;
    },

    disable: () => {
        debugging = false;
    },

    isDebugging: () => {
        return debugging;
    },

    debug: (output) => {
        if(debugging) {
            console.log(output);
        }
    }
}