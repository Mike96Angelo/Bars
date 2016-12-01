var Token = require('../tokens'),
    ValueToken = Token.tokens.value,
    LiteralToken = Token.tokens.literal,
    OperatorToken = Token.tokens.operator,
    TransformToken = Token.tokens.transform,
    utils = require('../utils');

var _PRECEDENCE_ = {
    '+': 1,
    '-': 1,
    '*': 2,
    '/': 2,
    '%': 2,
    '^': 3,
    '!': Infinity
};

function PRECEDENCE(op) {
    return _PRECEDENCE_[op] || 0;
}

function parseExpressionOperator(mode, code, tokens, flags, scope, parseMode) {
    var index = code.index,
        length = code.length,
        originalIndex = index,
        oldIndex,
        ch = code.codePointAt(index),
        ch2, ch3,
        expression,
        binary_fail,
        prevOp,
        usePrevOp;

    oldIndex = index;
    for (; index < length; index++) {
        ch = code.codePointAt(index);

        if (!utils.isWhitespace(ch)) break;

        if (flags.whitepaceString && ch === 0x000a) {
            code.index = index;
            return null;
        }
    }
    if (index === oldIndex) {
        binary_fail = true;
    }

    ch = code.codePointAt(index);
    ch2 = code.codePointAt(index + 1);
    ch3 = code.codePointAt(index + 2);

    if ( /* handle BINARY-EXPRESSION */
        (ch === 0x003d && ch2 === 0x003d && ch3 === 0x003d) || /* === */
        (ch === 0x0021 && ch2 === 0x003d && ch3 === 0x003d) /* !== */
    ) {
        code.index = index;
        expression = new OperatorToken(code);
        expression.operator = code.slice(index, index + 3);
        expression.binary = true;
        index += 2;
    } else if ( /* handle BINARY-EXPRESSION */
        (ch === 0x003d && ch2 === 0x003d) || /* == */
        (ch === 0x0021 && ch2 === 0x003d) || /* != */
        (ch === 0x003c && ch2 === 0x003d) || /* <= */
        (ch === 0x003e && ch2 === 0x003d) || /* >= */
        (ch === 0x0026 && ch2 === 0x0026) || /* && */
        (ch === 0x007c && ch2 === 0x007c) /* || */
    ) {
        code.index = index;
        expression = new OperatorToken(code);
        expression.operator = code.slice(index, index + 2);
        expression.binary = true;
        index++;
    } else if ( /* handle BINARY-EXPRESSION */
        (ch === 0x002b) || /* + */
        (ch === 0x002d) || /* - */
        (ch === 0x002a) || /* * */
        (ch === 0x002f) || /* / */
        (ch === 0x0025) || /* % */
        (ch === 0x003c) || /* < */
        (ch === 0x003e) /* > */
    ) {
        code.index = index;
        expression = new OperatorToken(code);
        expression.operator = code.charAt(index);
        expression.binary = true;
    } else if ( /* handle UNARY-EXPRESSION */
        ch === 0x0021 /* ! */
    ) {
        code.index = index;
        expression = new OperatorToken(code);
        expression.operator = code.charAt(index);
        expression.unary = true;
        index++;
    }

    if (!expression || !expression.operator) {
        if (binary_fail) {
            return null;
        }
        code.index = index;
        return true;
    }

    expression.precedence = PRECEDENCE(expression.operator);

    if (expression.binary) {
        if (binary_fail) {
            throw code.makeError(
                originalIndex, originalIndex + expression.operator.length,
                'Unexpected Token: ' +
                JSON.stringify(expression.operator) +
                ' missing whitespace before operator.'
            );
        }
        expression.arguments[0] = tokens.pop();

        if (!expression.arguments[0]) {
            throw code.makeError(
                index, index + expression.operator.length,
                'Missing left-hand <arg>.'
            );
        }

        if (!ValueToken.isCreation(expression.arguments[0]) &&
            !LiteralToken.isCreation(expression.arguments[0]) &&
            !OperatorToken.isCreation(expression.arguments[0]) &&
            !TransformToken.isCreation(expression.arguments[0])
        ) {
            throw code.makeError(
                expression.arguments[0].range[0],
                expression.arguments[0].range[1],
                'Unexpected left-hand <arg>: ' +
                JSON.stringify(expression.arguments[0].source(code)) +
                '.'
            );
        }

        prevOp = expression.arguments[0];
        usePrevOp = false;

        if (
            OperatorToken.isCreation(prevOp) &&
            prevOp.precedence < expression.precedence
        ) {
            expression.arguments.pop();

            expression.arguments.push(prevOp.arguments.pop());

            prevOp.arguments.push(expression);

            usePrevOp = true;
        }

        expression.range[0] = expression.arguments[0].range[0];
        expression.loc.start = expression.arguments[0].loc.start;

        index++;
        oldIndex = index;
        ch = code.codePointAt(index);
        for (; index < length; index++) {
            ch = code.codePointAt(index);

            if (!utils.isWhitespace(ch)) break;

            if (flags.whitepaceString && ch === 0x000a) {
                code.index = index;
                return null;
            }
        }
        if (index === oldIndex) {
            throw code.makeError(
                index, index + 1,
                'Unexpected Token: Expected <whitespace> but found ' +
                JSON.stringify(code.charAt(index)) +
                '.'
            );
        }
    }

    var args = [];
    code.index = index;
    scope.push(expression);

    parseMode('LOGIC', args, flags);

    expression.arguments[1] = args[0];

    if (args.length > 1) {
        throw code.makeError(
            args[1].range[0], args[1].range[1],
            'Unexpected Token: ' +
            JSON.stringify(args[1].source(code)) + '.'
        );
    }

    args = null;

    if (!expression.closed || !expression.arguments[1]) {
        code.index = index;
        throw code.makeError(
            index, index + expression.operator.length,
            'Missing right-hand <arg>.'
        );
    }

    if (!ValueToken.isCreation(expression.arguments[1]) &&
        !LiteralToken.isCreation(expression.arguments[1]) &&
        !OperatorToken.isCreation(expression.arguments[1]) &&
        !TransformToken.isCreation(expression.arguments[1])
    ) {
        throw code.makeError(
            expression.arguments[1].range[0],
            expression.arguments[1].range[1],
            'Unexpected right-hand <arg>: ' +
            JSON.stringify(expression.arguments[1].source(code)) +
            '.'
        );
    }

    if (expression.unary) {
        if (
            OperatorToken.isCreation(scope.token)
        ) {
            scope.close();
            parseMode.close();
        }
    }

    return usePrevOp ? prevOp : expression;
}

module.exports = parseExpressionOperator;
