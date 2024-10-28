const vscode = require('vscode');
const path =  require('path');

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    let disposable = vscode.commands.registerCommand('extension.mainframeTerminal', function () {
        // Create and show a new webview
        const panel = vscode.window.createWebviewPanel(
            'mainframeTerminal', // Identifies the type of the webview
            'TN3270 Terminal', // Title of the panel displayed to the user
            vscode.ViewColumn.Beside, // Editor column to show the new webview panel in.
            {
                enableScripts: true,
                localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath, 'media'))]    
            } // Webview options.
        );

        const terminal = panel.webview.asWebviewUri(vscode.Uri.file(
            path.join(context.extensionPath, 'media', 'terminal.js')
        ));

        const css = panel.webview.asWebviewUri(vscode.Uri.file(
            path.join(context.extensionPath, 'media', 'emulator.css')
        ));

        panel.webview.html = getWebviewContent(css,terminal);

    });

    context.subscriptions.push(disposable);
}

function getWebviewContent(css,terminal) {
    return `
    <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TN3270 Emulator</title>
    <link rel="stylesheet" href="${css}">
</head>
<body>
<table id="terminal">
    <tr>
        <td id="screenContainer">
<pre id="screen" tabindex="0">
                                                                               
























</pre>
        </td>
    </tr>
    <tr>
        <td>
            <div id="oia">
                <hr/>
                <table>
                    <tr>
                        <td width="25%" id="messageArea"></td>
                        <td id="connectionArea" width="50%">[X] Disconnected</td>
                        <td id="coordinatesArea" width="25%">
                            <span id="row">01</span>/<span id="col">01</span>
                        </td>
                    </tr>
                </table>
            </div>
        </td>
    </tr>
</table>
<script src="${terminal}"></script>
</body>
</html>
    `
}

function deactivate() {}

module.exports = {
    activate,
    deactivate
}
