// parseExpressionAsEnd
var Token = require('../tokens');

function parseExpressionAsEnd(mode, code, tokens, flags, scope,
    parseMode) {
    if ( /* | */
        code.codePointAt(code.index) === 0x007c &&
        Token.tokens.as.isCreation(scope.token)
    ) {
        code.index++;
        scope.close();
        parseMode.close();
        return true;
    }

    return null;
}

module.exports = parseExpressionAsEnd;
