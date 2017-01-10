var Token = require('../tokens'),
    ValueToken = Token.tokens.value,
    OperatorToken = Token.tokens.operator,
    utils = require('../utils');

function parseExpressionValue(mode, code, tokens, flags, scope, parseMode) {
    var index = code.index,
        length = code.length,
        ch = code.codePointAt(index),
        nextCh,
        value,
        style,
        /* ~ */
        name = ch === 0x007e,
        /* @ */
        at = ch === 0x0040,
        dot,
        devider,
        dotdot;


    if (!utils.isHTMLIdentifierStart(ch) &&
        !name &&
        !at &&
        ch !== 0x002e /* . */
    ) {
        return null;
    }

    value = new ValueToken(code);
    var path = [],
        nameVal = '';

    if (name || at) { /* @ */
        path.push(code.charAt(index));
        index++;
    }

    for (; index < length; index++) {
        ch = code.codePointAt(index);
        nextCh = code.codePointAt(index + 1);

        if (utils.isHTMLIdentifier(ch)) {
            if (!devider && (dot || dotdot)) {
                throw code.makeError(
                    index, index + 1,
                    'Unexpected Token: ' +
                    JSON.stringify(code.charAt(index)) +
                    '.'
                );
            }

            if (devider && !utils.isHTMLIdentifierStart(ch)) {
                throw code.makeError(
                    index, index + 1,
                    'Unexpected Token: Expected <[A-Za-z]> but found ' +
                    JSON.stringify(code.charAt(index)) +
                    '.'
                );
            }

            nameVal += code.charAt(index);

            name = true;
            devider = false;
        } else if (!(name && at) && (name || dotdot || dot) && ch === 0x002f) { /* / */
            if (style === 0 || devider) {
                throw code.makeError(
                    index, index + 1,
                    'Unexpected Token: ' +
                    JSON.stringify(code.charAt(index)) +
                    '.'
                );
            }

            if (nameVal) {
                path.push(nameVal);
                nameVal = '';
            }

            style = 1;
            dotdot = false;
            devider = true;
        } else if (!name && ch === 0x002e && nextCh === 0x002e) { /* .. */
            if (dot || style === 0) {
                throw code.makeError(
                    index, index + 1,
                    'Unexpected Token: ' +
                    JSON.stringify(code.charAt(index)) +
                    '.'
                );
            }
            index++;
            path.push('..');
            style = 1;
            dotdot = true;
            devider = false;
        } else if (!at && ch === 0x002e) { /* . */
            if (style === 1 || devider) {
                throw code.makeError(
                    index, index + 1,
                    'Unexpected Token: ' +
                    JSON.stringify(code.charAt(index)) +
                    '.'
                );
            }

            if (name) {
                style = 0;
                devider = true;

                if (nameVal) {
                    path.push(nameVal);
                    nameVal = '';
                }
            }
            dot = true;
        } else {
            break;
        }
    }

    if (nameVal) {
        path.push(nameVal);
        nameVal = '';
    }

    if (index > code.index) {
        code.index = index;
        value.close();
        value.path = path;
        return value;
    }

    return null;
}

module.exports = parseExpressionValue;
