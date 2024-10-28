document.addEventListener('DOMContentLoaded', function () {
    let ws;
    const serverUrl = 'ws://localhost:31454';

    function connect() {
        // Connecting to WebSocket server
        ws = new WebSocket(serverUrl);

        // Connection opened
        ws.addEventListener('open', function (event) {
            document.getElementById('connectionArea').textContent = 'Connected';
            ws.send('{"status":"ready"}');
        });

        // Listen for messages
        ws.addEventListener('message', function (event) {
            var msg = JSON.parse(event.data);
            document.getElementById('connectionArea').textContent = 'Connected';
            if (msg.setText) {
                document.getElementById('row').textContent = msg.row;
                document.getElementById('col').textContent = msg.col;
                insertText(msg.setText,msg.row,msg.col);
            }
            if (msg.action) {
                document.getElementById('messageArea').textContent = msg.action;
            }
            if (msg.display) {
                document.getElementById('screen').textContent = msg.display;
            }
        });

        // Listen for possible errors
        ws.addEventListener('error', function (event) {
            console.error('WebSocket error:', event);
        });

        // Listen for the close connection event
        ws.addEventListener('close', function (event) {
            document.getElementById('connectionArea').textContent = '[X] Disconnected';
            // Attempt to reconnect every 2 seconds
            setTimeout(connect, 2000);
        });
    }

    // Initially connect to the WebSocket server
    connect();
});

function insertText(text, row, col) {
    var screenElement = document.getElementById('screen');
    var rows = screenElement.innerHTML;
    rows = decodeHtmlEntities(rows).split('\n');
    
    // Helper function to insert text with span, replacing existing content
    function insertAndReplace(rowText, text, col) {
        // Convert HTML entities to a placeholder for easier manipulation
        var placeholder = '\uFFFF';  // Use a rare Unicode character as placeholder
        var entityRegex = /&[a-zA-Z0-9]+;/g;
        var plainText = rowText.replace(/<[^>]*>/g, '').replace(entityRegex, placeholder);
        
        var actualIndex = 0;
        var plainIndex = 0;

        // Find the actual index in the HTML content corresponding to the plain text index
        while (plainIndex < col && actualIndex < rowText.length) {
            if (rowText[actualIndex] === '<') {
                // Skip HTML tags
                while (rowText[actualIndex] !== '>' && actualIndex < rowText.length) {
                    actualIndex++;
                }
            } else if (rowText[actualIndex] === '&' && /&[a-zA-Z0-9]+;/.test(rowText.substring(actualIndex))) {
                // Skip HTML entity
                while (rowText[actualIndex] !== ';' && actualIndex < rowText.length) {
                    actualIndex++;
                }
            } else if (plainIndex < col) {
                plainIndex++;
            }
            actualIndex++;
        }

        var beforeText = rowText.substring(0, actualIndex);
        var afterText = rowText.substring(actualIndex);

        // Count HTML entities as single characters when replacing
        var endOfReplaceIndex = 0;
        var charsToReplace = text.length;
        while (charsToReplace > 0 && endOfReplaceIndex < afterText.length) {
            if (afterText[endOfReplaceIndex] === '<') {
                // Skip HTML tags
                while (afterText[endOfReplaceIndex] !== '>' && endOfReplaceIndex < afterText.length) {
                    endOfReplaceIndex++;
                }
            } else if (afterText[endOfReplaceIndex] === '&' && /&[a-zA-Z0-9]+;/.test(afterText.substring(endOfReplaceIndex))) {
                // Skip HTML entity
                while (afterText[endOfReplaceIndex] !== ';' && endOfReplaceIndex < afterText.length) {
                    endOfReplaceIndex++;
                }
            }
            endOfReplaceIndex++;
            if (afterText[endOfReplaceIndex] !== '<' && !(afterText[endOfReplaceIndex] === '&' && /&[a-zA-Z0-9]+;/.test(afterText.substring(endOfReplaceIndex)))) {
                charsToReplace--;
            }
        }

        return beforeText + "<span style='color: limegreen'>" + text + "</span>" + afterText.substring(endOfReplaceIndex);
    }

    var currentRow = row;
    var currentCol = col-1;
    while (text.length > 0 && currentRow < rows.length) {
        var rowText = rows[currentRow];
        var partOfText = text;
        var rowPlainText = rowText.replace(/<[^>]*>/g, '').replace(/&[a-zA-Z0-9]+;/g, '\uFFFF');
        var spaceInRow = rowPlainText.length - currentCol;

        if (text.length > spaceInRow) {
            partOfText = text.slice(0, spaceInRow);
        }

        rows[currentRow] = insertAndReplace(rowText, partOfText, currentCol);

        text = text.slice(partOfText.length);
        currentRow++;
        currentCol = 0;  // Start at the beginning of the next row
    }

    screenElement.innerHTML = rows.join('\n');
}

function decodeHtmlEntities(html) {
    // Create a temporary DOM element to use as a decoder
    var tempElement = document.createElement('textarea');

    // Replace entities with their text equivalent
    return html.replace(/&[a-zA-Z0-9#]+;/g, function(entity) {
        tempElement.innerHTML = entity;
        return tempElement.textContent;
    });
}
