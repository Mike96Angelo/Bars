var compileit = require('compileit'),
    Token = require('../tokens'),
    OperatorToken = Token.tokens.operator,
    AssignmentToken = Token.tokens.assignment,
    utils = require('../utils');

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
        operator,
        args,
        p, b;

    if (
        (p = code.codePointAt(index) === 0x0028) || // ^[(]$
        (b = code.codePointAt(index) === 0x005b) // ^[\[]$
    ) {
        operator = new OperatorToken(code);
        code.index++;

        if (p) {
            operator.parentheses = true;
        } else if (b) {
            operator.brackets = true;
        }

        operator.operator = '.';

        args = [];
        scope.push(operator);

        parseMode('LOGIC-EXP', args, flags);
        // do more here

        args = utils.makeExpressionTree(args, code);

        if (args.length > 1) throw 'OPERATOR OPERAND MISMATCH';

        operator.operands.push(args[0]);

        if (p) {
            return args[0];
        } else if (b) {
            return operator;
        }
    } else if (
        (p = code.codePointAt(index) === 0x0029) || // ^[)]$
        (b = code.codePointAt(index) === 0x005d) // ^[\]]$
    ) {
        if (
            OperatorToken.isCreation(scope.token) &&
            (
                (p && scope.token.parentheses) ||
                (b && scope.token.brackets)
            )
        ) {
            code.index++;
            scope.close();
            parseMode.close();
            return true;
        } else {
            throw code.makeError(
                index,
                index + 1,
                'Unexpected token: ' + code.charAt(index)
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
                    !preToken.brackets &&
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
