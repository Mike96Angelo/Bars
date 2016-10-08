//parseHTMLAttrEnd

function parseHTMLAttrEnd(mode, code, tokens, flags, scope, parseMode) {
    if (code.codePointAt(code.index) === 0x0022 /* " */ ) {
        code.index++;

        scope.close();
        parseMode.close();

        return true;
    }

    return null;
}

module.exports = parseHTMLAttrEnd;
