var compileit = require('compileit'),
    Token = require('../tokens'),
    OperatorToken = Token.tokens.operator,
    AssignmentToken = Token.tokens.assignment,
    utils = require('../utils');

var ExpressionToken = compileit.Token.generate(
    function ExpressionToken(code) {
        var _ = this;

        compileit.Token.call(_, code, 'expression');
    }
);

// function opS(ch) {
//     return ch === 0x0021 ||
//         (0x0025 <= ch && ch <= 0x0026) ||
//         (0x002a <= ch && ch <= 0x002b) ||
//         ch === 0x002d ||
//         ch === 0x002f ||
//         (0x003c <= ch && ch <= 0x003e) ||
//         ch === 0x007c;
// }
function opS(ch) {
    return ch === 0x0021 ||
        (0x0025 <= ch && ch <= 0x0026) ||
        (0x002a <= ch && ch <= 0x002b) ||
        (0x002d <= ch && ch <= 0x002f) ||
        (0x003c <= ch && ch <= 0x003e) ||
        ch === 0x007c;
}

function opEQ(ch) {
    return ch === 0x0021 ||
        (0x003c <= ch && ch <= 0x003e);
}

function opEQEQ(ch) {
    return ch === 0x0021 ||
        ch === 0x003d;
}

function isEQ(ch) {
    return ch === 0x003d;
}

function isOR(ch) {
    return ch === 0x007c;
}

function isAND(ch) {
    return ch === 0x0026;
}

function parseParentheses(mode, code, tokens, flags, scope, parseMode) {
    var index = code.index,
        length = code.length,
        expression,
        args;

    if (code.codePointAt(index) === 0x0028) { // ^[(]$
        expression = new ExpressionToken(code);
        code.index++;
        expression.parentheses = true;
        args = [];
        scope.push(expression);
        parseMode('LOGIC-EXP', args, flags);
        // do more here

        args = utils.makeExpressionTree(args, code);

        if (args.length > 1) throw 'OPERATOR OPERAND MISMATCH';

        return args[0];
    } else if (code.codePointAt(index) === 0x0029) { // ^[)]$
        if (scope.token && scope.token.parentheses) {
            code.index++;
            scope.close();
            parseMode.close();
            return true;
        } else {
            throw code.makeError(
                index,
                index + 1,
                'Unexpected token: )'
            );
        }
    }

    return null;
}

function parseOperator(mode, code, tokens, flags, scope, parseMode) {
    var index = code.index,
        length = code.length,
        ch = code.codePointAt(index);

    if (!opS(ch)) {
        return null;
    }

    var operator = new OperatorToken(code);

    if (opEQ(ch) && isEQ(code.codePointAt(index + 1))) {
        index++;
    } else if (isEQ(ch)) {
        return null;
    }

    if (
        (isOR(ch) && isOR(code.codePointAt(index + 1))) ||
        (isAND(ch) && isAND(code.codePointAt(index + 1)))
    ) {
        index++;
    } else if (isOR(ch) || isAND(ch)) {
        throw code.makeError(
            operator.range[0],
            operator.range[1],
            'Unexpected token: ' +
            JSON.stringify(
                operator.source()
            )
            .slice(1, -1)
        );
    }

    if (opEQEQ(ch) && isEQ(code.codePointAt(index + 1))) {
        index++;
    }
    index++;

    code.index = index;

    operator.close();
    operator.operator = operator.source();
    var preToken = tokens[tokens.length - 1];
    var pre2Token = tokens[tokens.length - 2];
    if (
        AssignmentToken.isCreation(preToken) ||
        (
            operator.operator !== '!' &&
            (!preToken ||
                (!preToken.saturated &&
                    OperatorToken.isCreation(preToken)
                )
            )
        ) ||
        (
            OperatorToken.isCreation(preToken) &&
            preToken.operator === '!' &&
            OperatorToken.isCreation(pre2Token) &&
            pre2Token.operator === '!'
        )
    ) {
        throw code.makeError(
            operator.range[0],
            operator.range[1],
            'Unexpected token: ' +
            JSON.stringify(
                operator.source()
            )
            .slice(1, -1)
        );
    }

    return operator;
}

function parseExpressionOperator(mode, code, tokens, flags, scope, parseMode) {
    return (
        parseOperator(mode, code, tokens, flags, scope, parseMode) ||
        parseParentheses(mode, code, tokens, flags, scope, parseMode)
    );
}

module.exports = parseExpressionOperator;
