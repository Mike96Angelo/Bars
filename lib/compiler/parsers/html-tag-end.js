// parseHTMLTagEnd

function parseHTMLTagEnd(mode, code, tokens, flags, scope, parseMode) {
    var ch = code.codePointAt(code.index);
    /* > */
    if (ch === 0x003e) {
        code.index++;
        scope.close();

        parseMode.close();
        return true;
    } else if ( /* /> */
        ch === 0x002f &&
        code.codePointAt(code.index + 1) === 0x003e
    ) {
        code.index += 2;
        var tag = scope.close();
        tag.selfClosed = true;

        parseMode.close();
        return true;
    }

    return null;
}

module.exports = parseHTMLTagEnd;
