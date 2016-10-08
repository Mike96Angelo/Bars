//parseBarsMarkup

function parseBarsMarkup(mode, code, tokens, flags, scope, parseMode) {
    var index = code.index,
        length = code.length;

    if ( /* {{ */
        code.codePointAt(index) === 0x007b &&
        code.codePointAt(++index) === 0x007b
    ) {
        flags.markup = {};
        flags.markup.mode = mode;
        parseMode('BARS', tokens, flags);

        if (code.index > index) {
            if (flags.markup && flags.markup.closeParseScope) {
                parseMode.close();
            }
            delete flags.markup;
            if (scope.token) {
                scope.token.updates();
            }
            return true;
        }

        delete flags.markup;
    }

    return null;
}

module.exports = parseBarsMarkup;
