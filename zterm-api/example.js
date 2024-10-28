/**
 * This code shows an example of how to connect and run a macro in javascript
 * 
 * If the zterm-emulator is installed in VS code, you will visually be able to see
 * the screens navigate as you build your script in javascript.
 * 
 * What's possible? Using zterm-js, you can essentially build an javascript module and embed
 * a TN3270 emulator directly in the browser for use any browser supported device (including mobile).
 * 
 * This prevents from having to use outdated technology or manually install an application on a desktop.
 * 
 * Debugging: Using any javascript debugger, you can step through the screens without worrying about XML macros
 * like HOD.
 * 
 * Performance: This scripting engine is capable of nagivating up to 25 mainframe screens per second. It's blazingly fast
 * and doesn't rely on traditional Java or native code in other languages. It can truly be run on any javascript capable device.
 */

var terminal = require('./vscode/terminal');

async function connect() {
    terminal.setDelayTime(10); //set delay time between interactions (in milliseconds);

    await terminal.connect("<ip or dns or mainframe>","992"); //992 is default SSL/TLS port
    console.log("test");

    await terminal.waitForText("Z/OS Main Menu",true,3000);

    terminal.setText("Test",2,4);
    terminal.setText("Hello world!", 16,12);
    await terminal.sendCommand("[enter]");

    await terminal.waitForText("ISPF Main Menu",true,3000);
    let extractedText = terminal.getText(6,4,10);
    console.log(`'${extractedText}' was successfully extracted`);

    await terminal.disconnect();
}

connect().then(()=> {
    console.log("Congratulations!");
}).catch((err)=> {console.log(err)})