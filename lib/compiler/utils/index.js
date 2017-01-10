var SELF_CLOSEING_TAGS = require('./self-closing-tags');
var ENTITIES = require('./html-entities');

var Token = require('../tokens'),
    AssignmentToken = Token.tokens.assignment,
    ValueToken = Token.tokens.value,
    OperatorToken = Token.tokens.operator;

function pathSpliter(path) {
    var splitPath;

    if (path instanceof Array) {
        splitPath = path;
    } else if (typeof path === 'string') {
        if (path.match(/[/]|[.][.]/)) {
            splitPath = path.split('/');
        } else {
            splitPath = path.split('.');
        }

        if (!splitPath[0] && !splitPath[1]) {
            splitPath = ['.'];
        }

        var barsProp = splitPath.pop()
            .split('@');
        if (barsProp[0]) {
            splitPath.push(barsProp[0]);
        }
        if (barsProp[1]) {
            splitPath.push('@' + barsProp[1]);
        }
    } else {
        throw 'bad arrgument: expected String | Array<String>.';
    }

    return splitPath;
}
exports.pathSpliter = pathSpliter;

function isSelfClosing(name) {
    return SELF_CLOSEING_TAGS.indexOf(name) !== -1;
}
exports.isSelfClosing = isSelfClosing;

function isHTMLIdentifierStart(ch) {
    return (0x0041 <= ch && ch <= 0x005a) ||
        (0x0061 <= ch && ch <= 0x007a);
}
exports.isHTMLIdentifierStart = isHTMLIdentifierStart;

function isHTMLEntity(ch) {
    /* ^[0-9A-Za-z]$ */
    return (0x0030 <= ch && ch <= 0x0039) ||
        (0x0041 <= ch && ch <= 0x005a) ||
        (0x0061 <= ch && ch <= 0x007a);
}
exports.isHTMLEntity = isHTMLEntity;

function isHTMLIdentifier(ch) {
    /* ^[0-9A-Z_a-z-]$ */
    return ch === 0x002d ||
        (0x0030 <= ch && ch <= 0x0039) ||
        (0x0041 <= ch && ch <= 0x005a) ||
        ch === 0x005f ||
        (0x0061 <= ch && ch <= 0x007a);
}
exports.isHTMLIdentifier = isHTMLIdentifier;


function isWhitespace(ch) {
    /* ^\s$ */
    return (0x0009 <= ch && ch <= 0x000d) ||
        ch === 0x0020 ||
        ch === 0x00a0 || /* nbsp */
        ch === 0x1680 ||
        ch === 0x180e ||
        (0x2000 <= ch && ch <= 0x200a) ||
        (0x2028 <= ch && ch <= 0x2029) ||
        ch === 0x202f ||
        ch === 0x205f ||
        ch === 0x3000 ||
        ch === 0xfeff;
}
exports.isWhitespace = isWhitespace;

function minifyHTMLText(text) {
    return text.replace(/(\s*)/g, function ($1) {
        return $1.split('')
            .sort(function (a, b) {
                a = a.codePointAt(0);
                b = b.codePointAt(0);
                if (a !== 0x00a0 && b === 0x00a0) return 1;
                if (a === 0x00a0 && b !== 0x00a0) return -1;
                return 0;
            })
            .join('')
            .replace(/[^\u00a0]+/, ' ');
    });
}
exports.minifyHTMLText = minifyHTMLText;

function getHTMLUnEscape(str) {
    var code;

    code = ENTITIES[str.slice(1, -1)];

    if (typeof code !== 'number' && str[1] === '#') {
        code = parseInt(str.slice(2, -1), 0x000a);
    }

    if (typeof code === 'number' && !isNaN(code)) {
        return String.fromCharCode(code);
    }

    return str;
}

exports.getHTMLUnEscape = getHTMLUnEscape;



var OpPresidence = {
    dm: ['/', '%', '*'],
    as: ['+', '-'],
    c: ['===', '==', '!==', '!=', '<=', '>=', '>', '<'],
    ao: ['||', '&&']
};

function makeExpressionTree(tokens, code) {
    var i, temp = [],
        token,
        errL = null,
        errR = null;

    for (i = tokens.length - 1; i >= 0; i--) {
        token = tokens[i];
        if (!token.saturated &&
            OperatorToken.isCreation(token) &&
            token.operator === '!'
        ) {
            token.saturated = true;
            token.operands.push(temp.shift());

            if (!token.operands[token.operands.length - 1]) {
                errR = token;
            }
        }
        temp.unshift(token);
    }

    tokens = temp;
    temp = [];

    for (i = tokens.length - 1; i >= 0; i--) {
        token = tokens[i];
        if (!token.saturated &&
            OperatorToken.isCreation(token) &&
            token.operator === '!'
        ) {
            token.saturated = true;
            token.operands.push(temp.shift());

            if (!token.operands[token.operands.length - 1]) {
                errR = token;
            }
        }
        temp.unshift(token);
    }

    tokens = temp;
    temp = [];

    for (i = 0; i < tokens.length; i++) {
        token = tokens[i];
        if (!token.saturated &&
            OperatorToken.isCreation(token) &&
            OpPresidence.dm.indexOf(token.operator) !== -1
        ) {
            token.saturated = true;
            token.operands.push(temp.pop());

            if (!token.operands[token.operands.length - 1]) {
                errL = token;
            }

            token.operands.push(tokens[++i]);

            if (!token.operands[token.operands.length - 1]) {
                errR = token;
            }
        }
        temp.push(token);
    }

    tokens = temp;
    temp = [];

    for (i = 0; i < tokens.length; i++) {
        token = tokens[i];
        if (!token.saturated &&
            OperatorToken.isCreation(token) &&
            OpPresidence.as.indexOf(token.operator) !== -1
        ) {
            token.saturated = true;
            token.operands.push(temp.pop());

            if (!token.operands[token.operands.length - 1]) {
                errL = token;
            }

            token.operands.push(tokens[++i]);

            if (!token.operands[token.operands.length - 1]) {
                errR = token;
            }
        }
        temp.push(token);
    }

    tokens = temp;
    temp = [];

    for (i = 0; i < tokens.length; i++) {
        token = tokens[i];
        if (!token.saturated &&
            OperatorToken.isCreation(token) &&
            OpPresidence.c.indexOf(token.operator) !== -1
        ) {
            token.saturated = true;
            token.operands.push(temp.pop());

            if (!token.operands[token.operands.length - 1]) {
                errL = token;
            }

            token.operands.push(tokens[++i]);

            if (!token.operands[token.operands.length - 1]) {
                errR = token;
            }
        }
        temp.push(token);
    }

    tokens = temp;
    temp = [];

    for (i = 0; i < tokens.length; i++) {
        token = tokens[i];
        if (!token.saturated &&
            OperatorToken.isCreation(token) &&
            OpPresidence.ao.indexOf(token.operator) !== -1
        ) {
            token.saturated = true;
            token.operands.push(temp.pop());

            if (!token.operands[token.operands.length - 1]) {
                errL = token;
            }

            token.operands.push(tokens[++i]);

            if (!token.operands[token.operands.length - 1]) {
                errR = token;
            }
        }
        temp.push(token);
    }

    tokens = temp;

    if (errL) {
        throw code.makeError(
            errL.range[0],
            errL.range[1],
            'Missing left-hand operand for: ' +
            JSON.stringify(
                errL.source()
            )
            .slice(1, -1)
        );
    }

    if (errR) {
        throw code.makeError(
            errR.range[0],
            errR.range[1],
            'Missing right-hand operand for: ' +
            JSON.stringify(
                errR.source()
            )
            .slice(1, -1)
        );
    }

    return tokens;
}

exports.makeExpressionTree = makeExpressionTree;

function isName(token) {
    return ValueToken.isCreation(token) &&
        token.path.length === 1 &&
        token.path[0] !== '~' &&
        token.path[0] !== '..' &&
        token.path[0] !== '.' &&
        token.path[0] !== '@';
}

function sortArgsAndContextMap(tokens, code) {
    var i,
        temp = [],
        token1,
        token2,
        token3;

    for (i = 0; i < tokens.length; i++) {
        token1 = tokens[i];
        token2 = tokens[i + 1];
        token3 = tokens[i + 2];

        if (
            isName(token1) &&
            AssignmentToken.isCreation(token2)
        ) {
            token2.name = token1.path[0];

            if (!AssignmentToken.isCreation(token3)) {
                token2.expression = token3;
                temp.push(token2);
                i += 2;
            } else {
                throw code.makeError(
                    token2.range[0],
                    token2.range[2],
                    'Unexpected token: ' +
                    JSON.stringify(token2.source())
                    .slice(1, -1)
                );
            }
        } else {
            temp.push(token1);
        }
    }

    var map = [];
    var args = [];

    for (i = 0; i < temp.length; i++) {
        if (AssignmentToken.isCreation(temp[i])) {
            map.push(temp[i]);
        } else {
            args.push(temp[i]);
        }
    }

    return {
        args: args,
        map: map
    };
}
exports.sortArgsAndContextMap = sortArgsAndContextMap;
