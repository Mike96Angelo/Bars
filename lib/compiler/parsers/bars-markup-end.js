// parseBarsMarkupEnd
var Token = require('../tokens');

function parseBarsMarkupEnd(mode, code, tokens, flags, scope, parseMode) {
    if ( /* }} */
        code.codePointAt(code.index) === 0x007d &&
        code.codePointAt(code.index + 1) === 0x007d
    ) {
        // console.log(JSON.stringify(scope.token.toObject(), null, 2))
        if (
            Token.tokens.insert.isCreation(scope.token) ||
            Token.tokens.block.isCreation(scope.token) ||
            Token.tokens.partial.isCreation(scope.token)
        ) {
            code.index += 2;
            scope.close();
            parseMode.close();
            return true;
        }
    }

    return null;
}

module.exports = parseBarsMarkupEnd;
