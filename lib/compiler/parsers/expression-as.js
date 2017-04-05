var Token = require('../tokens'),
    AsToken = Token.tokens.as,
    utils = require('../utils');

/* as | <var> <var> ... | */
function parseExpressionAs(mode, code, tokens, flags, scope, parseMode) {
    var index = code.index,
        length = code.length,
        asToken,
        ch;

    if ( /* as */
        code.codePointAt(index) === 0x0061 &&
        code.codePointAt(index + 1) === 0x0073
    ) {
        index += 3;
    } else {
        return null;
    }

    for (; index < length; index++) {
        ch = code.codePointAt(index);
        if (!utils.isWhitespace(ch)) {
            break;
        }
    }

    if (code.codePointAt(index) !== 0x007c) { /* | */
        throw code.makeError(
            index,
            index + 1,
            'Unexpected Token: ' + JSON.stringify(code.charAt(index))
            .slice(1, -1)
        );
    }
    index++;

    asToken = new AsToken(code);

    code.index = index;

    var vars = [];
    scope.push(asToken);

    flags.asExpression = true;
    parseMode('LOGIC-AS', vars, flags);
    delete flags.asExpression;

    asToken.vars = vars.map(function (item) {
        return item.path[0];
    });

    if (vars.length < 1) {
        throw code.makeError(
            asToken.range[0],
            asToken.range[1],
            'Unexpected token: ' +
            JSON.stringify(
                asToken.source()
            )
            .slice(1, -1)
        );
    }

    return asToken;
}

module.exports = parseExpressionAs;
