var SELF_CLOSEING_TAGS = require('./self-closing-tags');
var ENTITIES = require('./html-entities');

var Token = require('../tokens'),
    AsToken = Token.tokens.as,
    AssignmentToken = Token.tokens.assignment,
    LiteralToken = Token.tokens.literal,
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
        (0x0061 <= ch && ch <= 0x007a) ||
        ch === 0x005f;
}
exports.isHTMLIdentifierStart = isHTMLIdentifierStart;

function isHTMLEntity(ch) {
    /* ^[0-9A-Za-z]$ */
    return (0x0030 <= ch && ch <= 0x0039) ||
        (0x0041 <= ch && ch <= 0x005a) ||
        (0x0061 <= ch && ch <= 0x007a) ||
        ch === 0x005f;
}
exports.isHTMLEntity = isHTMLEntity;

function isHTMLIdentifier(ch) {
    /* ^[0-9A-Z_a-z-]$ */
    return ch === 0x002d ||
        (0x0030 <= ch && ch <= 0x0039) ||
        (0x0041 <= ch && ch <= 0x005a) ||
        (0x0061 <= ch && ch <= 0x007a) ||
        ch === 0x005f;
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
    ao: ['||', '&&'],
    co: ['?:']
};

function lookupExpression(tokens, code) {
    for (var i = 0; i < tokens.length; i++) {
        prevToken = tokens[i - 1];
        token = tokens[i];
        nextToken = tokens[i + 1];
        var dels = 3;

        if (
            OperatorToken.isCreation(token) &&
            token.operator === '.' &&
            !token.saturated
        ) {
            if (!OperatorToken.isCreation(prevToken) ||
                prevToken.saturated
            ) {
                token.operands.unshift(prevToken);

                if (token.operands.length === 1) {
                    if (isName(nextToken)) {
                        var lit = new LiteralToken(code);
                        lit.range = nextToken.range;
                        lit.loc = nextToken.loc;
                        lit.value = nextToken.path[0];
                        lit.closed = true;
                        token.operands.push(lit);
                    } else {
                        throw code.makeError(
                            token.range[0],
                            token.range[1],
                            'Unexpected token: ' +
                            JSON.stringify(token.source())
                            .slice(1, -1)
                        );
                    }
                } else {
                    dels = 2;
                }
            } else {
                throw code.makeError(
                    token.range[0],
                    token.range[1],
                    'Unexpected token: ' +
                    JSON.stringify(token.source())
                    .slice(1, -1)
                );
            }

            token.saturated = true;
            tokens.splice(Math.max(0, i - 1), dels, token);

            i--;
        }
    }
}

function unaryExpression(tokens, code) {
    for (var i = tokens.length - 1; i >= 0; i--) {
        token = tokens[i];
        nextToken = tokens[i + 1];

        if (
            OperatorToken.isCreation(token) &&
            token.operator === '!'
        ) {
            if (!OperatorToken.isCreation(nextToken) ||
                nextToken.saturated
            ) {
                token.operands.push(nextToken);
            } else {
                console.log(token);
                throw code.makeError(
                    token.range[0],
                    token.range[1],
                    'Unexpected token: ' +
                    JSON.stringify(token.source())
                    .slice(1, -1)
                );
            }

            token.saturated = true;
            tokens.splice(i, 2, token);
        }
    }
}

function binaryExpression(tokens, key, code) {
    for (var i = 0; i < tokens.length; i++) {
        prevToken = tokens[i - 1];
        token = tokens[i];
        nextToken = tokens[i + 1];
        // console.log(
        //     i, '\n',
        //     prevToken && prevToken.constructor.name,
        //     token && token.constructor.name,
        //     nextToken && nextToken.constructor.name
        // );

        if (
            OperatorToken.isCreation(token) &&
            !token.saturated &&
            OpPresidence[key].indexOf(token.operator) !== -1

        ) {
            if (!OperatorToken.isCreation(prevToken) ||
                prevToken.saturated
            ) {
                token.operands.unshift(prevToken);

                if (!OperatorToken.isCreation(nextToken) ||
                    nextToken.saturated
                ) {
                    token.operands.push(nextToken);
                } else {
                    throw code.makeError(
                        token.range[0],
                        token.range[1],
                        'Unexpected token: ' +
                        JSON.stringify(token.source())
                        .slice(1, -1)
                    );
                }
            } else {
                throw code.makeError(
                    token.range[0],
                    token.range[1],
                    'Unexpected token: ' +
                    JSON.stringify(token.source())
                    .slice(1, -1)
                );
            }
            token.saturated = true;
            tokens.splice(i - 1, 3, token);
            i--;
        }
    }
}

function makeExpressionTree(tokens, code) {
    lookupExpression(tokens, code);
    unaryExpression(tokens, code);

    for (var key in OpPresidence) {
        if (OpPresidence.hasOwnProperty(key)) {
            binaryExpression(tokens, key, code);
        }
    }

    // console.log(tokens[0], expressionTree(tokens[0]));

    return tokens;
}

exports.makeExpressionTree = makeExpressionTree;

function isName(token) {
    return ValueToken.isCreation(token) &&
        token.path.length === 1 &&
        token.path[0] !== 'this' &&
        token.path[0] !== '~' &&
        token.path[0] !== '..' &&
        token.path[0] !== '.' &&
        token.path[0] !== '@';
}

function sortArgsAndContextMap(tokens, code) {
    var i,
        temp = [],
        prevToken,
        token,
        nextToken;

    for (i = 0; i < tokens.length; i++) {

        prevToken = tokens[i - 1];
        token = tokens[i];
        nextToken = tokens[i + 1];

        if (
            AssignmentToken.isCreation(token)
        ) {
            if (isName(prevToken)) {
                token.name = prevToken.path[0];

                if (!AssignmentToken.isCreation(nextToken) &&
                    !AsToken.isCreation(nextToken)
                ) {
                    token.expression = nextToken;
                } else {
                    throw code.makeError(
                        token.range[0],
                        token.range[1],
                        'Unexpected token: ' +
                        JSON.stringify(token.source())
                        .slice(1, -1)
                    );
                }
            } else {
                throw code.makeError(
                    token.range[0],
                    token.range[1],
                    'Unexpected token: ' +
                    JSON.stringify(token.source())
                    .slice(1, -1)
                );
            }

            tokens.splice(i - 1, 3, token);
        }
    }

    var map = [];
    var args = [];
    var as = [];

    for (i = 0; i < tokens.length; i++) {
        if (AsToken.isCreation(tokens[i])) {
            as.push(tokens[i]);
        } else if (AssignmentToken.isCreation(tokens[i])) {
            map.push(tokens[i]);
        } else {
            args.push(tokens[i]);
        }
    }

    if (as.length > 1) {
        throw code.makeError(
            as[1].range[0],
            as[1].range[1],
            'Unexpected token: ' +
            JSON.stringify(as[1].source())
            .slice(1, -1)
        );
    }

    return {
        args: args,
        as: as[0],
        map: map
    };
}
exports.sortArgsAndContextMap = sortArgsAndContextMap;


function expressionTree(op, d) {
    d = d || 0;

    if (!op) return '';

    var s = '';

    s += (op.operator || op.value || op.name || op.path.join()) + '\n';

    if (op.operator) {
        d += 2;
        var sp = (new Array(d + 1))
            .join(' ');
        s += sp;
        s += expressionTree(op.operands[0], d);

        if (op.operands[1]) {
            s += sp;
            s += expressionTree(op.operands[1], d);
        }

        if (op.operands[2]) {
            s += sp;
            s += expressionTree(op.operands[2], d);
        }
    }

    return s;

}
