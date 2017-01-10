var compileit = require('compileit');
var parsers = require('./parsers');

var Token = require('./tokens');

/* Parse Modes */

var parseModes = {
    'TEXT': [
        parsers.parseText,
        parsers.parseBarsMarkup
    ],
    'BARS': [
        parsers.parseBarsComment,
        parsers.parseBarsBlock,
        parsers.parseBarsPartial,
        parsers.parseBarsInsert
    ],
    'DOM': [
        parsers.parseText,
        parsers.parseHTMLComment,
        parsers.parseHTMLTag,
        parsers.parseBarsMarkup
    ],
    'ATTR': [
        parsers.parseHTMLTagEnd,
        parsers.parseWhitspace,
        parsers.parseHTMLAttr,
        parsers.parseBarsMarkup
    ],
    'VALUE': [
        parsers.parseHTMLAttrEnd,
        parsers.parseText,
        parsers.parseBarsMarkup
    ],
    'LOGIC': [
        parsers.parseBarsMarkupEnd,
        parsers.parseExpressionLiteral,
        parsers.parseExpressionTransform,
        parsers.parseExpressionValue,
        parsers.parseExpressionOperator,
        parsers.parseExpressionAssignment,
        parsers.parseWhitspace
    ],
    'LOGIC-EXP': [
        parsers.parseBarsMarkupEnd,
        parsers.parseExpressionLiteral,
        parsers.parseExpressionTransform,
        parsers.parseExpressionValue,
        parsers.parseExpressionOperator,
        parsers.parseWhitspace
    ],
    'LOGIC-ARGS': [
        parsers.parseExpressionTransformEnd,
        parsers.parseExpressionLiteral,
        parsers.parseExpressionTransform,
        parsers.parseExpressionValue,
        parsers.parseExpressionOperator,
        parsers.parseWhitspace
    ]
};

var compiler = new compileit.Compiler(parseModes, {
    modeFormater: function (a) {
        return a.green;
    },
    charFormater: function (a) {
        return a.green.underline;
    },
    funcFormater: function (a) {
        return a.red;
    },
    typeFormater: function (a) {
        return a.red;
    },
    sourceFormater: function (a) {
        return ('`' + a + '`')
            .green.underline;
    }
});

function compile(str, file, mode, flags) {
    mode = mode || 'DOM';
    flags = flags || {};

    var program = new Token.tokens.program(),
        frag = new Token.tokens.fragment();

    frag.nodesUpdate = 1;

    program.mode = mode;
    program.fragment = frag;

    frag.nodes = compiler.compile(str, file, mode, flags);

    return program;
}

module.exports = compile;
