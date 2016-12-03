var Token = require('../tokens'),
    LiteralToken = Token.tokens.literal,
    OperatorToken = Token.tokens.operator;

function STRING(mode, code, tokens, flags, scope, parseMode) {
    var ch,
        index = code.index,
        length = code.length,
        text;

    /* ' */
    if (code.codePointAt(index) !== 0x0027) {
        return null;
    }

    index++;

    text = new LiteralToken(code);
    text.value = '';

    for (; index < length; index++) {
        ch = code.codePointAt(index);

        if (ch === 0x000a) {
            code.index = index;
            return null;
        }

        if ( /* ' but not \' */
            ch === 0x0027 &&
            code.codePointAt(index - 1) !== 0x005c
        ) {
            index++;
            break;
        }

        text.value += code.charAt(index);
    }

    if (index > code.index) {
        code.index = index;
        text.close();

        var preToken = tokens[tokens.length - 1];
        if (preToken && !OperatorToken.isCreation(preToken)) {
            throw code.makeError(
                number.range[0],
                number.range[1],
                'Unexpected token: ' +
                JSON.stringify(
                    number.source()
                )
                .slice(1, -1)
            );
        }

        return text;
    }

    return null;
}

function NUMBER(mode, code, tokens, flags, scope, parseMode) {
    var index = code.index,
        length = code.length,
        ch = code.codePointAt(index),
        nextCh = code.codePointAt(index + 1),
        dot,
        Ee;

    if (
        (ch === 0x002d && 0x0030 <= nextCh && nextCh <= 0x0039) || /* -[0-9] */
        (0x0030 <= ch && ch <= 0x0039) /* [0-9] */
    ) {
        index++;

        number = new LiteralToken(code);

        for (; index < length; index++) {
            ch = code.codePointAt(index);

            if (0x0030 <= ch && ch <= 0x0039) {
                continue;
            } else if (ch === 0x0045 || ch === 0x0065) { /* [Ee] */
                index++;

                ch = code.codePointAt(index);
                nextCh = code.codePointAt(index + 1);

                if ( /* [+-]?[0-9] */
                    Ee ||
                    !(
                        (
                            (ch === 0x002b || ch === 0x002d) &&
                            (0x0030 <= nextCh && nextCh <= 0x0039)
                        ) ||
                        (0x0030 <= ch && ch <= 0x0039)
                    )
                ) {
                    code.index = index - 1;
                    throw code.makeError(
                        'Unexpected Token: ' +
                        JSON.stringify(code.charAt(index - 1)) +
                        '.'
                    );
                }

                Ee = true;
            } else if (ch === 0x002e) { /* . */
                index++;
                ch = code.codePointAt(index);
                if ( /* [+-]?[0-9] */
                    Ee ||
                    dot ||
                    !(0x0030 <= ch && ch <= 0x0039)
                ) {
                    code.index = index - 1;
                    throw code.makeError(
                        'Unexpected Token: ".".'
                    );
                }

                dot = true;
            } else {
                break;
            }
        }
        code.index = index;
        number.close();
        number.value = Number(number.source(code));

        var preToken = tokens[tokens.length - 1];
        if (preToken && !OperatorToken.isCreation(preToken)) {
            throw code.makeError(
                number.range[0],
                number.range[1],
                'Unexpected token: ' +
                JSON.stringify(
                    number.source()
                )
                .slice(1, -1)
            );
        }

        return number;
    }

    return null;
}

function BOOLEAN(mode, code, tokens, flags, scope, parseMode) {
    var index = code.index,
        bool;

    if ( /* true */
        code.codePointAt(index) === 0x0074 &&
        code.codePointAt(++index) === 0x0072 &&
        code.codePointAt(++index) === 0x0075 &&
        code.codePointAt(++index) === 0x0065
    ) {
        bool = true;
    } else if ( /* false */
        code.codePointAt(index) === 0x0066 &&
        code.codePointAt(++index) === 0x0061 &&
        code.codePointAt(++index) === 0x006c &&
        code.codePointAt(++index) === 0x0073 &&
        code.codePointAt(++index) === 0x0065
    ) {
        bool = false;
    } else {
        return null;
    }

    var boolean = new LiteralToken(code);

    index++;
    code.index = index;
    boolean.close();

    boolean.value = bool;

    var preToken = tokens[tokens.length - 1];
    if (preToken && !OperatorToken.isCreation(preToken)) {
        throw code.makeError(
            number.range[0],
            number.range[1],
            'Unexpected token: ' +
            JSON.stringify(
                number.source()
            )
            .slice(1, -1)
        );
    }

    return bool;
}

function NULL(mode, code, tokens, flags, scope, parseMode) {
    var index = code.index,
        nul;

    if ( /* true */
        code.codePointAt(index) === 0x006e &&
        code.codePointAt(++index) === 0x0075 &&
        code.codePointAt(++index) === 0x006c &&
        code.codePointAt(++index) === 0x006c
    ) {
        index++;

        nul = new LiteralToken(code);
        code.index = index;
        nul.close();
        nul.value = null;
    } else {
        return null;
    }

    var preToken = tokens[tokens.length - 1];
    if (preToken && !OperatorToken.isCreation(preToken)) {
        throw code.makeError(
            number.range[0],
            number.range[1],
            'Unexpected token: ' +
            JSON.stringify(
                number.source()
            )
            .slice(1, -1)
        );
    }

    return nul;
}


function parseExpressionLiteral(mode, code, tokens, flags, scope, parseMode) {
    return (
        STRING(mode, code, tokens, flags, scope, parseMode) ||
        NUMBER(mode, code, tokens, flags, scope, parseMode) ||
        BOOLEAN(mode, code, tokens, flags, scope, parseMode) ||
        NULL(mode, code, tokens, flags, scope, parseMode)
    );
}

module.exports = parseExpressionLiteral;
