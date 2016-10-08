// parseWhitspace

var utils = require('../utils');

function parseWhitspace(mode, code, tokens, flags, scope, parseMode) {
    var index = code.index,
        length = code.length,
        whitespace = 0;

    for (; index < length; index++) {
        if (!utils.isWhitespace(code.codePointAt(index))) {
            break;
        }
        if (
            flags.whitepaceString &&
            code.codePointAt(index) === 0x000a /* \n */
        ) {
            break;
        }
        whitespace++;
    }

    if (whitespace) {
        code.index = index;
        return true;
    }

    return null;
}

module.exports = parseWhitspace;
