// parseExpressionTransformEnd
var Token = require('../tokens');

function parseExpressionTransformEnd(mode, code, tokens, flags, scope,
    parseMode) {
    if ( /* ) */
        code.codePointAt(code.index) === 0x0029 &&
        Token.tokens.transform.isCreation(scope.token)
    ) {
        code.index++;
        scope.close();
        parseMode.close();
        return true;
    }

    if ( /* , */
        code.codePointAt(code.index) === 0x002c &&
        Token.tokens.transform.isCreation(scope.token)
    ) {
        code.index++;
        scope.token.nextArg = true;
        parseMode.close();
        return true;
    }

    return null;
}

module.exports = parseExpressionTransformEnd;
