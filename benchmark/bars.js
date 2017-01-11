(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.Bars = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports = require('./lib');

},{"./lib":46}],2:[function(require,module,exports){
var Generator = require('generate-js'),
    Renderer = require('./renderer'),
    Token = require('./compiler/tokens'),
    Blocks = require('./blocks'),
    Transform = require('./transforms'),
    packageJSON = require('../package');

var Bars = Generator.generate(function Bars() {
    var _ = this;

    _.defineProperties({
        blocks: new Blocks(),
        partials: {},
        transforms: new Transform()
    });
});

Bars.definePrototype({
    version: packageJSON.version,
    build: function build(parsedTemplate, state) {
        var _ = this,
            program = parsedTemplate;

        if (Array.isArray(parsedTemplate)) {
            program = new Token.tokens.program();

            program.fromArray(parsedTemplate);
        }

        return new Renderer(_, program, state);
    },

    registerBlock: function registerBlock(name, block) {
        var _ = this;

        _.blocks[name] = block;
    },

    registerPartial: function registerPartial(name, compiledTemplate) {
        var _ = this;

        if (typeof compiledTemplate === 'string') {
            if (!_.preCompile) {
                throw 'partials must be pre-compiled using bars.preCompile(template)';
            }
            compiledTemplate = _.preCompile(compiledTemplate);
        }

        var program = compiledTemplate;

        if (Array.isArray(compiledTemplate)) {
            program = new Token.tokens.program();

            program.fromArray(compiledTemplate);
        }

        _.partials[name] = program;
    },

    registerTransform: function registerTransform(name, func) {
        var _ = this;

        _.transforms[name] = func;
    },
});

module.exports = Bars;

},{"../package":94,"./blocks":4,"./compiler/tokens":31,"./renderer":48,"./transforms":52,"generate-js":62}],3:[function(require,module,exports){
var Bars = require('./bars-runtime'),
    compile = require('./compiler');

Bars.definePrototype({
    compile: function compile(template, filename, mode, flags) {
        var _ = this;
        return _.build(_.preCompile(template, filename, mode,
            flags));
    },

    preCompile: function preCompile(template, filename, mode, flags) {
        return compile(template, filename, mode, flags);
    }
});

module.exports = Bars;

},{"./bars-runtime":2,"./compiler":6}],4:[function(require,module,exports){
var Generator = require('generate-js');

var Blocks = Generator.generate(function Blocks() {});

Blocks.definePrototype({
    if: function ifBlock(args, consequent, alternate, context) {
        if (args[0]) {
            consequent();
        } else {
            alternate();
        }
    },

    with: function withBlock(args, consequent, alternate, context) {
        var _ = this,
            data = args[0];

        if (!args.length) {
            consequent();
        } else if (data && typeof data === 'object') {
            consequent(context.newContext(data));
        } else {
            alternate();
        }
    },

    each: function eachBlock(args, consequent, alternate, context) {
        var _ = this,
            data = args[0];

        if (data && typeof data === 'object') {
            var keys = Object.keys(data);

            if (keys.length) {
                for (var i = 0; i < keys.length; i++) {
                    consequent(
                        context.newContext(
                            data[keys[i]], {
                                key: keys[i],
                                index: i,
                                length: keys.length
                            }
                        )
                    );
                }
            } else {
                alternate();
            }
        } else {
            alternate();
        }
    }
});

module.exports = Blocks;

},{"generate-js":62}],5:[function(require,module,exports){
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

},{"./parsers":24,"./tokens":31,"compileit":55}],6:[function(require,module,exports){
module.exports = require('./compiler');

},{"./compiler":5}],7:[function(require,module,exports){
var Token = require('../tokens'),
    BlockToken = Token.tokens.block,
    FragmentToken = Token.tokens.fragment,
    utils = require('../utils');

function parseBarsBlock(mode, code, tokens, flags, scope, parseMode) {
    var index = code.index + 2,
        length = code.length,
        block,
        isOpening,
        isClosing,
        isElse,
        alternateIsBlock,
        blockMode = flags.markup.mode;

    if ( /* / */
        code.codePointAt(index) === 0x002f
    ) {
        isClosing = true;
        flags.markup.closeParseScope = true;
    } else if ( /* # */
        code.codePointAt(index) === 0x0023 ||
        (scope.token && scope.token.alternateIsBlock)
    ) {
        isOpening = true;
    } else if ( /* else */
        code.codePointAt(index) === 0x0065 &&
        code.codePointAt(++index) === 0x006c &&
        code.codePointAt(++index) === 0x0073 &&
        code.codePointAt(++index) === 0x0065
    ) {
        isElse = true;
        if (utils.isWhitespace(code.codePointAt(index + 1))) {
            index += 2;

            alternateIsBlock = true;
        } else if (
            code.codePointAt(++index) === 0x007d &&
            code.codePointAt(++index) === 0x007d
        ) {
            index++;
        }

        block = new BlockToken(code);
        code.index = index;
        block.close();

        if (!BlockToken.isCreation(scope.token) || scope.token.elsed) {
            throw code.makeError(
                block.range[0], block.range[1],
                'Unexpected Token: ' +
                JSON.stringify(block.source(code)) +
                '.'
            );
        }

        scope.token.elsed = true;

        scope.token.alternateIsBlock = alternateIsBlock;
        flags.markup.closeParseScope = true;

        scope.close();
        parseMode.close();

        return true;
    } else {
        return null;
    }

    if (scope.token && scope.token.alternateIsBlock) {
        index -= 2;
    } else
        index++;
    block = new BlockToken(code);

    if (!utils.isHTMLIdentifierStart(code.codePointAt(index))) {
        throw code.makeError(
            index, index + 1,
            'Unexpected Token: Expected <[A-Za-z]> but found ' +
            JSON.stringify(code.charAt(index)) +
            '.'
        );
    }

    for (; index < length; index++) {
        ch = code.codePointAt(index);

        if (utils.isHTMLIdentifier(ch)) {
            block.name += code.charAt(index);
        } else {
            break;
        }
    }

    if (isClosing) {
        if (
            code.codePointAt(index) === 0x007d &&
            code.codePointAt(++index) === 0x007d
        ) {
            index++;
        } else {
            throw code.makeError(
                index, index + 1,
                'Unexpected Token: Expected ' +
                JSON.stringify('}}') +
                ' but found ' +
                JSON.stringify(code.charAt(index)) +
                '.'
            );
        }

        code.index = index;
        block.close();

        if (!BlockToken.isCreation(scope.token)) {
            throw code.makeError(
                block.range[0], block.range[1],
                'Unexpected Closing Block: ' +
                JSON.stringify(block.source(code)) +
                '.'
            );
        }

        if (scope.token.name !== block.name) {
            throw code.makeError(
                block.range[0], block.range[1],
                'Mismatch Closing Block: Expected ' +
                JSON.stringify('{{/' + scope.token.name + '}}') +
                ' but found ' +
                JSON.stringify(block.source(code)) +
                '.'
            );
        }

        scope.close();

        parseMode.close();

        return true;
    }

    if (utils.isWhitespace(code.codePointAt(index)))
        index++;

    code.index = index;

    var args = [];

    scope.push(block);

    parseMode('LOGIC', args, flags);

    args = utils.makeExpressionTree(args, code);

    var am = utils.sortArgsAndContextMap(args, code);

    block.map = am.map;
    block.arguments = am.args;

    args = null;
    am = null;

    if (!block.closed) {
        throw code.makeError(
            code.index, code.index + 1,
            'Unclosed Block: Expected ' +
            JSON.stringify('}}') +
            ' but found ' +
            JSON.stringify(code.charAt(code.index)) +
            '.'
        );
    }

    block.consequent = new FragmentToken(code);

    delete block.closed;
    scope.push(block);

    parseMode(blockMode, block.consequent.nodes, flags);

    index = code.index;

    block.consequent.close();

    code.index = index;

    if (block.elsed) {
        if (block.alternateIsBlock) {
            delete block.closed;
            scope.push(block);

            flags.markup = {
                mode: blockMode
            };
            block.alternate = parseBarsBlock(mode, code, [], flags, scope,
                parseMode);

            delete flags.markup;

            scope.close();

            return block;
        }

        block.alternate = new FragmentToken(code);

        delete block.closed;
        scope.push(block);

        parseMode(blockMode, block.alternate.nodes, flags);

        index = code.index;

        block.alternate.close();
    }

    if (!block.closed) {
        throw code.makeError(
            block.range[0], block.range[0] + block.name.length + 6 +
            block.expression.length,
            'Unclosed Block: Expected ' +
            JSON.stringify('{{/' + block.name + '}}') +
            ' to fallow ' +
            JSON.stringify('{{#' + block.name + ' <expression>}}') +
            '.'
        );
    }

    parseMode.close();

    return block;
}

module.exports = parseBarsBlock;

},{"../tokens":31,"../utils":44}],8:[function(require,module,exports){
//parseBarsComment

function parseBarsComment(mode, code, tokens, flags, scope, parseMode) {
    var index = code.index + 2,
        length = code.length;

    if ( /* ! */
        code.codePointAt(index) === 0x0021
    ) {
        if (
            code.codePointAt(++index) === 0x002d &&
            code.codePointAt(++index) === 0x002d
        ) {
            index++;

            for (; index < length; index++) {
                if ( /* --}} */
                    code.codePointAt(index) === 0x002d &&
                    code.codePointAt(index + 1) === 0x002d &&
                    code.codePointAt(index + 2) === 0x007d &&
                    code.codePointAt(index + 3) === 0x007d
                ) {
                    index += 4; /* for --}} */
                    code.index = index;

                    parseMode.close();

                    if (flags.keepComments) {
                        // make a CommentToken and return that.
                    }

                    return true;
                }
            }

            throw code.makeError(
                'Unclosed Comment: Expected "--}}" to fallow "{{!--".',
                5
            );
        }

        index++;

        for (; index < length; index++) {

            if ( /* }} */
                code.codePointAt(index) === 0x007d &&
                code.codePointAt(index + 1) === 0x007d
            ) {
                index += 2; /* for }} */
                code.index = index;

                parseMode.close();

                if (flags.keepComments) {
                    // make a CommentToken and return that.
                }

                return true;
            }
        }

        throw code.makeError(
            code.index, code.index + 3,
            'Unclosed Comment: Expected "}}" to fallow "{{!".'
        );
    }

    return null;
}

module.exports = parseBarsComment;

},{}],9:[function(require,module,exports){
var InsertToken = require('../tokens')
    .tokens.insert,
    utils = require('../utils');

function parseBarsInsert(mode, code, tokens, flags, scope, parseMode) {
    var index = code.index + 2,
        length = code.length,
        insert = new InsertToken(code),
        args = [];

    scope.push(insert);
    code.index = index;

    parseMode('LOGIC-EXP', args, flags);

    args = utils.makeExpressionTree(args, code);

    if (args.length > 1) {
        code.index = args[1].range[0];
        throw code.makeError(
            args[1].range[0], args[1].range[1],
            'Unexpected Token: ' +
            JSON.stringify(args[1].source(code)) + '.'
        );
    }

    insert.expression = args[0];

    args = null;

    if (!insert.closed) {
        throw code.makeError(
            code.index, code.index + 1,
            'Unclosed Block: Expected ' +
            JSON.stringify('}}') +
            ' but found ' +
            JSON.stringify(code.charAt(code.index)) +
            '.'
        );
    }

    if (!insert.expression) {
        throw code.makeError(
            code.index - 2, code.index - 1,
            'Missing <expression>.'
        );
    }

    parseMode.close();
    return insert;
}


module.exports = parseBarsInsert;

},{"../tokens":31,"../utils":44}],10:[function(require,module,exports){
// parseBarsMarkupEnd
var Token = require('../tokens');

function parseBarsMarkupEnd(mode, code, tokens, flags, scope, parseMode) {
    if ( /* }} */
        code.codePointAt(code.index) === 0x007d &&
        code.codePointAt(code.index + 1) === 0x007d
    ) {
        // console.log(JSON.stringify(scope.token.toObject(), null, 2))
        if (
            Token.tokens.insert.isCreation(scope.token) ||
            Token.tokens.block.isCreation(scope.token) ||
            Token.tokens.partial.isCreation(scope.token) ||
            Token.tokens.prop.isCreation(scope.token)
        ) {
            code.index += 2;
            scope.close();
            parseMode.close();
            return true;
        }
    }

    return null;
}

module.exports = parseBarsMarkupEnd;

},{"../tokens":31}],11:[function(require,module,exports){
//parseBarsMarkup

function parseBarsMarkup(mode, code, tokens, flags, scope, parseMode) {
    var index = code.index,
        length = code.length;

    if ( /* {{ */
        code.codePointAt(index) === 0x007b &&
        code.codePointAt(++index) === 0x007b
    ) {
        flags.markup = {};
        flags.markup.mode = mode;
        parseMode('BARS', tokens, flags);

        if (code.index > index) {
            if (flags.markup && flags.markup.closeParseScope) {
                parseMode.close();
            }
            delete flags.markup;
            if (scope.token) {
                scope.token.updates();
            }
            return true;
        }

        delete flags.markup;
    }

    return null;
}

module.exports = parseBarsMarkup;

},{}],12:[function(require,module,exports){
var PartialToken = require('../tokens')
    .tokens.partial,
    utils = require('../utils');

function parseBarsPartial(mode, code, tokens, flags, scope, parseMode) {
    var index = code.index + 2,
        length = code.length,
        partial,
        router = false;

    if ( /* > */
        code.codePointAt(index) === 0x003e
    ) {
        partial = new PartialToken(code);

        index++;

        if (code.codePointAt(index) === 0x003f) {
            router = true;
            index++;
        } else if (utils.isHTMLIdentifierStart(code.codePointAt(index))) {
            for (; index < length; index++) {
                ch = code.codePointAt(index);

                if (utils.isHTMLIdentifier(ch)) {
                    partial.name += code.charAt(index);
                } else {
                    break;
                }
            }
        } else {
            throw code.makeError(
                index, index + 1,
                'Unexpected Token: Expected <[A-Za-z]> but found ' +
                JSON.stringify(code.charAt(index)) +
                '.'
            );
        }

        code.index = index;

        var args = [];

        scope.push(partial);
        parseMode('LOGIC', args, flags);

        args = utils.makeExpressionTree(args, code);

        var am = utils.sortArgsAndContextMap(args, code);
        args = am.args;
        partial.map = am.map;

        am = null;

        if (args.length > (router ? 2 : 1)) {
            throw code.makeError(
                args[1].range[0], args[1].range[1],
                'Unexpected Token: ' +
                JSON.stringify(args[1].source(code)) + '.'
            );
        }

        if (router) {
            partial.name = args[0] || null;
            partial.expression = args[1] || null;
        } else {
            partial.expression = args[0] || null;
        }

        args = null;

        if (!partial.closed) {
            throw code.makeError(
                index, index + 1,
                'Unclosed Block: Expected ' +
                JSON.stringify('}}') +
                ' but found ' +
                JSON.stringify(code.charAt(code.index)) +
                '.'
            );
        }

        parseMode.close();
        return partial;
    }

    return null;
}

module.exports = parseBarsPartial;

},{"../tokens":31,"../utils":44}],13:[function(require,module,exports){
var Token = require('../tokens'),
    ValueToken = Token.tokens.value,
    AssignmentToken = Token.tokens.assignment;

function isEQ(ch) {
    return ch === 0x003d;
}

function parseAssignment(mode, code, tokens, flags, scope, parseMode) {
    var index = code.index,
        length = code.length;

    if (!isEQ(code.codePointAt(index))) {
        return null;
    }

    var assignment = new AssignmentToken(code);

    code.index++;

    assignment.close();

    var preToken = tokens[tokens.length - 1];

    if (!ValueToken.isCreation(preToken)) {
        throw code.makeError(
            assignment.range[0],
            assignment.range[1],
            'Unexpected Token: ' +
            JSON.stringify(
                assignment.source()
            )
            .slice(1, -1)
        );

    }

    return assignment;
}

module.exports = parseAssignment;

},{"../tokens":31}],14:[function(require,module,exports){
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

    return boolean;
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

},{"../tokens":31}],15:[function(require,module,exports){
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

},{"../tokens":31,"../utils":44,"compileit":55}],16:[function(require,module,exports){
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

},{"../tokens":31}],17:[function(require,module,exports){
var Token = require('../tokens'),
    TransformToken = Token.tokens.transform,
    OperatorToken = Token.tokens.operator,
    utils = require('../utils');

function parseExpressionTransform(mode, code, tokens, flags, scope, parseMode) {
    var index = code.index,
        length = code.length,
        transform,
        ch = code.codePointAt(index);

    if (ch !== 0x0040) { /* @ */
        return null;
    }

    index++;

    if (!utils.isHTMLIdentifierStart(code.codePointAt(index))) {
        return null;
    }

    transform = new TransformToken(code);

    for (; index < length; index++) {
        ch = code.codePointAt(index);

        if (utils.isHTMLIdentifier(ch)) {
            transform.name += code.charAt(index);
        } else {
            break;
        }
    }

    ch = code.codePointAt(index);
    if (ch === 0x0028) { /* ( */
        index++;
        code.index = index;

        scope.push(transform);

        while (code.left) {
            var args = [];


            parseMode('LOGIC-ARGS', args, flags);

            args = utils.makeExpressionTree(args, code);

            if (args.length > 1) {
                code.index = args[1].range[0];
                throw code.makeError(
                    args[1].range[0], args[1].range[1],
                    'Unexpected Token: ' +
                    JSON.stringify(args[1].source(code)) + '.'
                );
            }

            transform.arguments.push(args[0]);

            if (transform.nextArg) {
                delete transform.nextArg;
                delete transform.closed;
            }

            if (transform.closed) {
                break;
            }
        }
    } else {
        return null;
    }

    return transform;
}

module.exports = parseExpressionTransform;

},{"../tokens":31,"../utils":44}],18:[function(require,module,exports){
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

},{"../tokens":31,"../utils":44}],19:[function(require,module,exports){
//parseHTMLAttrEnd

function parseHTMLAttrEnd(mode, code, tokens, flags, scope, parseMode) {
    if (code.codePointAt(code.index) === 0x0022 /* " */ ) {
        code.index++;

        scope.close();
        parseMode.close();

        return true;
    }

    return null;
}

module.exports = parseHTMLAttrEnd;

},{}],20:[function(require,module,exports){
// parseHTMLAttr
var Token = require('../tokens'),
    AttrToken = Token.tokens.attr,
    PropToken = Token.tokens.prop,
    utils = require('../utils');

function parseHTMLAttr(mode, code, tokens, flags, scope, parseMode) {
    var index = code.index,
        length = code.length,
        attr;

    if (!utils.isHTMLIdentifierStart(code.codePointAt(index))) {
        return null;
    }

    attr = new AttrToken(code);
    prop = new PropToken(code);

    for (; index < length; index++) {

        if (!utils.isHTMLIdentifier(code.codePointAt(index))) {
            break;
        }

        attr.name += code.charAt(index);
    }

    prop.name = attr.name;

    if (attr.name) {
        /* = */
        if (code.codePointAt(index) === 0x003d) {
            index++;
            /* " */
            if (code.codePointAt(index) === 0x0022) {
                index++;
                code.index = index;

                scope.push(attr);
                flags.whitepaceString = true;
                parseMode('VALUE', attr.nodes, flags);
                delete flags.whitepaceString;
            } else {
                throw code.makeError(
                    index, index + 1,
                    'Unexpected Token: Expected "\"" but found ' +
                    JSON.stringify(code.charAt(index))
                );
            }
        } else if (code.codePointAt(index) === 0x003a) { /* : */
            index++;
            if ( /* {{ */
                code.codePointAt(index) === 0x007b &&
                code.codePointAt(index + 1) === 0x007b
            ) {
                var args = [];
                code.index = index + 2;
                scope.push(prop);
                parseMode('LOGIC-EXP', args, flags);

                args = utils.makeExpressionTree(args, code);

                if (args.length > 1) {
                    code.index = args[1].range[0];
                    throw code.makeError(
                        args[1].range[0], args[1].range[1],
                        'Unexpected Token: ' +
                        JSON.stringify(args[1].source(code)) + '.'
                    );
                }

                prop.expression = args[0];

                args = null;

                if (!prop.closed) {
                    throw code.makeError(
                        code.index, code.index + 1,
                        'Unclosed Block: Expected ' +
                        JSON.stringify('}}') +
                        ' but found ' +
                        JSON.stringify(code.charAt(code.index)) +
                        '.'
                    );
                }

                if (!prop.expression) {
                    throw code.makeError(
                        code.index - 2, code.index - 1,
                        'Missing <expression>.'
                    );
                }

                return prop;

            } else {
                throw code.makeError(
                    index - 1, index,
                    'Unexpected Token: :'
                );
            }
        } else {
            code.index = index;
            attr.close();
        }

        if (!attr.closed) {
            throw code.makeError(
                attr.range[0] + attr.name.length + 1,
                attr.range[0] + attr.name.length + 2,
                'Unclosed String: Expected "\"" to fallow "\""'
            );
        }

        if (scope.token && attr.nodesUpdate) {
            scope.token.updates('attr');
        }

        return attr;
    }

    return null;
}

module.exports = parseHTMLAttr;

},{"../tokens":31,"../utils":44}],21:[function(require,module,exports){
//parseHTMLComment

function parseHTMLComment(mode, code, tokens, flags, scope, parseMode) {
    var index = code.index,
        length = code.length;

    if ( /* <!-- */
        code.codePointAt(index) === 0x003c &&
        code.codePointAt(++index) === 0x0021 &&
        code.codePointAt(++index) === 0x002d &&
        code.codePointAt(++index) === 0x002d
    ) {
        index++;

        for (; index < length; index++) {
            if ( /* --> */
                code.codePointAt(index) === 0x002d &&
                code.codePointAt(index + 1) === 0x002d &&
                code.codePointAt(index + 2) === 0x003e
            ) {
                index += 3;
                code.index = index;

                return true;
            }
        }

        throw code.makeError(
            code.index, code.index + 4,
            'Unclosed Comment: Expected "-->" to fallow "<!--".'
        );
    }

    return null;
}

module.exports = parseHTMLComment;

},{}],22:[function(require,module,exports){
// parseHTMLTagEnd

function parseHTMLTagEnd(mode, code, tokens, flags, scope, parseMode) {
    var ch = code.codePointAt(code.index);
    /* > */
    if (ch === 0x003e) {
        code.index++;
        scope.close();

        parseMode.close();
        return true;
    } else if ( /* /> */
        ch === 0x002f &&
        code.codePointAt(code.index + 1) === 0x003e
    ) {
        code.index += 2;
        var tag = scope.close();
        tag.selfClosed = true;

        parseMode.close();
        return true;
    }

    return null;
}

module.exports = parseHTMLTagEnd;

},{}],23:[function(require,module,exports){
var Token = require('../tokens'),
    TagToken = Token.tokens.tag,
    AttrToken = Token.tokens.attr,
    PropToken = Token.tokens.prop,
    utils = require('../utils');


function parseHTMLTag(mode, code, tokens, flags, scope, parseMode) {
    var index = code.index,
        length = code.length,
        tag,
        isClosing;
    if ( /* < */
        code.codePointAt(index) === 0x003c
    ) {
        if ( /* / */
            code.codePointAt(index + 1) === 0x002f
        ) {
            isClosing = true;
            index++;
        }

        tag = new TagToken(code);

        index++;

        if (!utils.isHTMLIdentifierStart(code.codePointAt(index))) {
            throw code.makeError(
                index, index + 1,
                'Unexpected Token: Expected <[A-Za-z]> but found ' +
                JSON.stringify(code.charAt(index)) +
                '.'
            );
        }

        for (; index < length; index++) {
            ch = code.codePointAt(index);

            if (utils.isHTMLIdentifier(ch)) {
                tag.name += code.charAt(index);
            } else {
                break;
            }
        }

        code.index = index;

        if (isClosing) {
            if (ch !== 0x003e) { /* > */
                throw code.makeError(
                    index, index + 1,
                    'Unexpected Token: Expected ' +
                    JSON.stringify('>') +
                    ' but found ' +
                    JSON.stringify(code.charAt(index)) +
                    '.'
                );
            }

            index++;

            code.index = index;
            tag.close();

            if (!TagToken.isCreation(scope.token)) {
                throw code.makeError(
                    tag.range[0], tag.range[1],
                    'Unexpected Closing Tag: ' +
                    JSON.stringify(tag.source(code)) +
                    '.'
                );
            }

            if (scope.token.name !== tag.name) {
                throw code.makeError(
                    tag.range[0], tag.range[1],
                    'Mismatch Closing Tag: Expected ' +
                    JSON.stringify('</' + scope.token.name + '>') +
                    ' but found ' +
                    JSON.stringify(tag.source(code)) +
                    '.'
                );
            }

            scope.close();
            parseMode.close();

            return true;
        }

        var attrsAndProps = [];

        scope.push(tag);
        parseMode('ATTR', attrsAndProps, flags);

        tag.attrs = attrsAndProps.filter(function (token) {
            return AttrToken.isCreation(token);
        });

        tag.props = attrsAndProps.filter(function (token) {
            return PropToken.isCreation(token);
        });

        attrsAndProps = null;

        if (!tag.closed) {
            throw code.makeError(
                index, index + 1,
                'Unclosed Tag: Expected ' +
                JSON.stringify('>') +
                ' but found ' +
                JSON.stringify(code.charAt(code.index)) +
                '.'
            );
        }

        if (utils.isSelfClosing(tag.name)) {
            tag.selfClosing = true;
        }

        if (tag.selfClosing || tag.selfClosed) {
            return tag;
        }

        delete tag.closed;

        if (tag.name === 'pre' || tag.name === 'style' || tag.name ===
            'script') {
            flags.minify = false;
        }

        scope.push(tag);

        if (tag.name === 'style' || tag.name === 'script') {
            flags.textExitTag = tag.name;
            parseMode('TEXT', tag.nodes, flags);
            delete flags.textExitTag;
        } else {
            parseMode(mode, tag.nodes, flags);
        }

        if (!tag.closed) {
            throw code.makeError(
                tag.range[0], tag.range[1],
                'Unclosed Tag: Expected ' +
                JSON.stringify('</' + tag.name + '>') +
                ' to fallow ' +
                JSON.stringify(tag.source(code)) +
                '.'
            );
        }

        if (scope.token && (tag.attrsUpdate || tag.nodesUpdate)) {
            scope.token.updates();
        }

        return tag;
    }

    return null;
}


module.exports = parseHTMLTag;

},{"../tokens":31,"../utils":44}],24:[function(require,module,exports){
// text
exports.parseText = require('./text');
exports.parseWhitspace = require('./whitespace');

// HTML markup
exports.parseHTMLComment = require('./html-comment');
exports.parseHTMLTag = require('./html-tag');
exports.parseHTMLTagEnd = require('./html-tag-end');
exports.parseHTMLAttr = require('./html-attr');
exports.parseHTMLAttrEnd = require('./html-attr-end');

// Bars markup
exports.parseBarsMarkup = require('./bars-markup');
exports.parseBarsComment = require('./bars-comment');
exports.parseBarsInsert = require('./bars-insert');
exports.parseBarsPartial = require('./bars-partial');
exports.parseBarsBlock = require('./bars-block');
exports.parseBarsMarkupEnd = require('./bars-markup-end');

// Expression
exports.parseExpressionValue = require('./expression-value');
exports.parseExpressionLiteral = require('./expression-literal');
exports.parseExpressionOperator = require('./expression-operator');
exports.parseExpressionAssignment = require('./expression-assignment');
exports.parseExpressionTransform = require('./expression-transform');
exports.parseExpressionTransformEnd = require('./expression-transform-end');

},{"./bars-block":7,"./bars-comment":8,"./bars-insert":9,"./bars-markup":11,"./bars-markup-end":10,"./bars-partial":12,"./expression-assignment":13,"./expression-literal":14,"./expression-operator":15,"./expression-transform":17,"./expression-transform-end":16,"./expression-value":18,"./html-attr":20,"./html-attr-end":19,"./html-comment":21,"./html-tag":23,"./html-tag-end":22,"./text":25,"./whitespace":26}],25:[function(require,module,exports){
var TextToken = require('../tokens')
    .tokens.text,
    utils = require('../utils');

function parseText(mode, code, tokens, flags, scope,
    parseMode) {
    var index = code.index,
        isEntity = false,
        entityStr = '',
        value = '',
        textExitTag;

    if (mode === 'DOM') {
        for (; index < code.length; index++) {
            ch = code.codePointAt(index);

            if (
                ch === 0x003c /* < */ ||
                ch === 0x007b /* { */ &&
                code.codePointAt(index + 1) === 0x007b /* { */
            ) {
                value += entityStr;
                break;
            }

            if (ch === 0x0026 /* & */ ) {
                isEntity = true;
                entityStr = code.charAt(index);

                continue;
            } else if (isEntity && ch === 0x003b /* ; */ ) {
                entityStr += code.charAt(index);

                value += utils.getHTMLUnEscape(entityStr);

                isEntity = false;
                entityStr = '';

                continue;
            }

            if (isEntity && utils.isHTMLEntity(ch)) {
                entityStr += code.charAt(index);
            } else {
                value += entityStr;
                isEntity = false;
                entityStr = '';

                value += code.charAt(index);
            }
        }
    } else if (flags.whitepaceString) {
        for (; index < code.length; index++) {
            ch = code.codePointAt(index);

            /* \n */
            if (ch === 0x000a) {
                code.index = index;
                return null;
            }

            if ( /* " but not \" */
                ch === 0x0022 &&
                code.codePointAt(index - 1) !== 0x005c
            ) {
                break;
            }

            if ( /* {{ */
                ch === 0x007b &&
                code.codePointAt(index + 1) === 0x007b
            ) {
                break;
            }
        }
    } else {
        for (; index < code.length; index++) {
            if (
                code.codePointAt(index) === 0x007b /* { */ &&
                code.codePointAt(index + 1) === 0x007b /* { */
            ) {
                break;
            } else if (
                flags.textExitTag === 'script' &&
                /* </script> */
                code.codePointAt(index) === 0x003c &&
                code.codePointAt(index + 1) === 0x002f &&

                code.codePointAt(index + 2) === 0x0073 &&
                code.codePointAt(index + 3) === 0x0063 &&
                code.codePointAt(index + 4) === 0x0072 &&
                code.codePointAt(index + 5) === 0x0069 &&
                code.codePointAt(index + 6) === 0x0070 &&
                code.codePointAt(index + 7) === 0x0074 &&

                code.codePointAt(index + 8) === 0x003e
            ) {
                textExitTag = 9;
                break;
            } else if (
                flags.textExitTag === 'style' &&
                /* </style> */
                code.codePointAt(index) === 0x003c &&
                code.codePointAt(index + 1) === 0x002f &&

                code.codePointAt(index + 2) === 0x0073 &&
                code.codePointAt(index + 3) === 0x0074 &&
                code.codePointAt(index + 4) === 0x0079 &&
                code.codePointAt(index + 5) === 0x006c &&
                code.codePointAt(index + 6) === 0x0065 &&

                code.codePointAt(index + 7) === 0x003e
            ) {
                textExitTag = 8;
                break;
            }
        }
    }

    if (code.index < index) {
        var text = new TextToken(code);

        code.index = index;

        text.close();

        if (flags.minify) {
            text.value = utils.minifyHTMLText(value || text.source(code));
            if (/^\s*$/.test(text.value))
                return true;
        } else {
            text.value = value || text.source(code);
        }

        if (flags.textExitTag && textExitTag) {
            code.index += textExitTag;
            scope.close();
            parseMode.close();
        }

        return text;
    }

    return null;
}

module.exports = parseText;

},{"../tokens":31,"../utils":44}],26:[function(require,module,exports){
// parseWhitspace

var utils = require('../utils');

function parseWhitspace(mode, code, tokens, flags, scope, parseMode) {
    var index = code.index,
        length = code.length,
        whitespace = 0;

    for (; index < length; index++) {
        if (!utils.isWhitespace(code.codePointAt(index))) {
            break;
        }
        if (
            flags.whitepaceString &&
            code.codePointAt(index) === 0x000a /* \n */
        ) {
            break;
        }
        whitespace++;
    }

    if (whitespace) {
        code.index = index;
        return true;
    }

    return null;
}

module.exports = parseWhitspace;

},{"../utils":44}],27:[function(require,module,exports){
var Token = require('./token');

var AssignmentToken = Token.generate(
    function AssignmentToken(code) {
        var _ = this;

        if (code) {
            Token.call(_, code);
        }

        _.name = '';

        _.expression = null;
    }
);


AssignmentToken.definePrototype({
    enumerable: true
}, {
    type: 'assignment'
});

AssignmentToken.definePrototype({
    TYPE_ID: Token.tokens.push(AssignmentToken) - 1,
    toArray: function () {
        var _ = this;
        return [
            _.TYPE_ID,
            _.name,
            _.expression
        ];
    },

    toObject: function () {
        var _ = this;
        return {
            type: _.type,
            TYPE_ID: _.TYPE_ID,
            name: _.name,
            expression: _.expression
        };
    },

    _fromArray: function _fromArray(arr) {
        var _ = this;

        _.name = arr[1];

        _.expression = new Token.tokens[arr[2][0]]();

        _.expression.fromArray(arr[2]);
    },

    toString: function toString() {
        // var _ = this,
        //     str = '';
        //
        // if (_.operands.length === 1) {
        //     str += _.assignment + _.operands[0].toString();
        // } else if (_.operands.length === 2) {
        //     str += _.operands[0].toString();
        //     str += ' ' + _.assignment + ' ';
        //     str += _.operands[1].toString();
        // }
        //
        // return str;
    }
});

Token.tokens.assignment = AssignmentToken;

},{"./token":40}],28:[function(require,module,exports){
var Token = require('./token');

var AttrToken = Token.generate(
    function AttrToken(code) {
        var _ = this;

        if (code) {
            Token.call(_, code);
        }

        _.name = '';

        _.nodes = [];

        _.nodesUpdate = 0;
    }
);


AttrToken.definePrototype({
    enumerable: true
}, {
    type: 'attr'
});

AttrToken.definePrototype({
    TYPE_ID: Token.tokens.push(AttrToken) - 1,
    toArray: function () {
        var _ = this;
        return [
            _.TYPE_ID,
            _.name,
            _.nodes,
            _.nodesUpdate
        ];
    },

    toObject: function () {
        var _ = this;
        return {
            type: _.type,
            TYPE_ID: _.TYPE_ID,
            name: _.name,
            nodes: _.nodes,
            nodesUpdate: _.nodesUpdate
        };
    },

    _fromArray: function _fromArray(arr) {
        var _ = this;

        _.name = arr[1];

        _.nodes = arr[2].map(function (item) {
            var node = new Token.tokens[item[0]]();

            node.fromArray(item);

            return node;
        });

        _.nodesUpdate = arr[3];
    },

    toString: function toString() {
        var _ = this,
            str = ' ';

        str += _.name + (_.nodes.length ? '="' : '');

        for (var i = 0; i < _.nodes.length; i++) {

            _.nodes[i].indentLevel = '';

            str += _.nodes[i].toString();
        }

        str += (_.nodes.length ? '"' : '');

        return str;
    },
    updates: function updates() {
        var _ = this;

        _.nodesUpdate = 1;
    }
});

Token.tokens.attr = AttrToken;

},{"./token":40}],29:[function(require,module,exports){
var Token = require('./token');

var BlockToken = Token.generate(
    function BlockToken(code) {
        var _ = this;

        if (code) {
            Token.call(_, code);
        }

        _.name = '';

        _.arguments = null;
        _.map = null;

        _.consequent = null;
        _.alternate = null;
    }
);


BlockToken.definePrototype({
    enumerable: true
}, {
    type: 'block'
});

BlockToken.definePrototype({
    TYPE_ID: Token.tokens.push(BlockToken) - 1,
    toArray: function () {
        var _ = this;
        return [
            _.TYPE_ID,
            _.name,
            _.arguments,
            _.map,
            _.consequent,
            _.alternate
        ];
    },

    toObject: function () {
        var _ = this;
        return {
            type: _.type,
            TYPE_ID: _.TYPE_ID,
            name: _.name,
            arguments: _.arguments,
            map: _.map,
            consequent: _.consequent,
            alternate: _.alternate
        };
    },

    _fromArray: function _fromArray(arr) {
        var _ = this;

        _.name = arr[1];

        _.arguments = arr[2].map(function (item) {
            var arg = new Token.tokens[item[0]]();

            arg.fromArray(item);

            return arg;
        });

        _.map = arr[3].map(function (item) {
            var arg = new Token.tokens[item[0]]();

            arg.fromArray(item);

            return arg;
        });

        var consequent = new Token.tokens.fragment();

        consequent.fromArray(arr[4]);

        _.consequent = consequent;

        if (arr[5]) {
            var alternate = new Token.tokens[arr[5][0]]();

            alternate.fromArray(arr[5]);

            _.alternate = alternate;
        }
    },

    toString: function toString() {
        var _ = this,
            str = '';

        if (!_.fromElse) {
            str += _.indentLevel + '{{#';
        }

        str += _.name + ' ';

        str += _.expression.toString();
        str += (_.map ? _.map.toString() : '');

        str += '}}';

        _.consequent.indentLevel = (_.indentLevel ? _.indentLevel +
            '  ' : '');
        str += _.consequent.toString();

        if (_.alternate) {
            _.alternate.indentLevel = _.indentLevel;
            if (_.alternate.type === 'block') {
                _.alternate.fromElse = true;
                str += _.indentLevel + '{{else ' + _.alternate.toString();
                return str;
            }
            _.alternate.indentLevel += (_.indentLevel ? _.indentLevel +
                '  ' : '');

            str += _.indentLevel + '{{else}}';
            str += _.alternate.toString();
        }

        str += _.indentLevel + '{{/' + _.name + '}}';

        return str;
    },
    updates: function updates() {
        var _ = this;

        if (_.elsed && _.alternate) {
            _.alternate.nodesUpdate = 1;
        } else if (_.consequent) {
            _.consequent.nodesUpdate = 1;
        }
    }
});

Token.tokens.block = BlockToken;

},{"./token":40}],30:[function(require,module,exports){
var Token = require('./token');

var FragmentToken = Token.generate(
    function FragmentToken(code) {
        var _ = this;

        if (code) {
            Token.call(_, code);
        }

        _.nodes = [];

        _.nodesUpdate = 0;
    }
);


FragmentToken.definePrototype({
    enumerable: true
}, {
    type: 'fragment'
});

FragmentToken.definePrototype({
    TYPE_ID: Token.tokens.push(FragmentToken) - 1,
    toArray: function () {
        var _ = this;
        return [
            _.TYPE_ID,
            _.nodes,
            _.nodesUpdate
        ];
    },

    toObject: function () {
        var _ = this;
        return {
            type: _.type,
            TYPE_ID: _.TYPE_ID,
            nodes: _.nodes,
            nodesUpdate: _.nodesUpdate
        };
    },

    _fromArray: function _fromArray(arr) {
        var _ = this;

        _.nodes = arr[1].map(function (item) {
            var node = new Token.tokens[item[0]]();

            node.fromArray(item);

            return node;
        });

        _.nodesUpdate = arr[2];
    },

    toString: function toString() {
        var _ = this,
            str = '';

        for (var i = 0; i < _.nodes.length; i++) {
            _.nodes[i].indentLevel = _.indentLevel;
            str += _.nodes[i].toString();
        }

        return str;
    },
    updates: function updates() {
        var _ = this;

        _.nodesUpdate = 1;
    }
});

Token.tokens.fragment = FragmentToken;

},{"./token":40}],31:[function(require,module,exports){
var Token = require('./token');

// program
require('./program');
require('./fragment');

// html markup
require('./text');
require('./tag');
require('./attr');
require('./prop');

// bars markup
require('./block');
require('./insert');
require('./partial');

// bars expression
require('./literal');
require('./value');
require('./transform');
require('./operator');

// context-maps
require('./assignment');

module.exports = Token;
// module.exports = window.Token = Token;




// test

// var prog = new Token.tokens.program();
//
// prog.fragment = new Token.tokens.fragment();
//
// for (var i = 0; i < 5; i++) {
//     prog.fragment.nodes.push(new Token.tokens.tag());
// }

// window.prog = prog;

},{"./assignment":27,"./attr":28,"./block":29,"./fragment":30,"./insert":32,"./literal":33,"./operator":34,"./partial":35,"./program":36,"./prop":37,"./tag":38,"./text":39,"./token":40,"./transform":41,"./value":42}],32:[function(require,module,exports){
var Token = require('./token');

var InsertToken = Token.generate(
    function InsertToken(code) {
        var _ = this;

        if (code) {
            Token.call(_, code);
        }

        _.expression = null;
    }
);


InsertToken.definePrototype({
    enumerable: true
}, {
    type: 'insert'
});

InsertToken.definePrototype({
    TYPE_ID: Token.tokens.push(InsertToken) - 1,
    toArray: function () {
        var _ = this;
        return [
            _.TYPE_ID,
            _.expression
        ];
    },

    toObject: function () {
        var _ = this;
        return {
            type: _.type,
            TYPE_ID: _.TYPE_ID,
            expression: _.expression
        };
    },

    _fromArray: function _fromArray(arr) {
        var _ = this;

        var expression = new Token.tokens[arr[1][0]]();

        expression.fromArray(arr[1]);

        _.expression = expression;
    },

    toString: function toString() {
        var _ = this,
            str = '{{ ';
        str += _.expression.toString();
        str += ' }}';
        return str;
    }
});

Token.tokens.insert = InsertToken;

},{"./token":40}],33:[function(require,module,exports){
var Token = require('./token');

var LiteralToken = Token.generate(
    function LiteralToken(code) {
        var _ = this;

        if (code) {
            Token.call(_, code);
        }

        _.value = '';
    }
);


LiteralToken.definePrototype({
    enumerable: true
}, {
    type: 'literal'
});

LiteralToken.definePrototype({
    TYPE_ID: Token.tokens.push(LiteralToken) - 1,
    toArray: function () {
        var _ = this;
        return [
            _.TYPE_ID,
            _.value
        ];
    },

    toObject: function () {
        var _ = this;
        return {
            type: _.type,
            TYPE_ID: _.TYPE_ID,
            value: _.value
        };
    },

    _fromArray: function _fromArray(arr) {
        var _ = this;

        _.value = arr[1];
    },
    toString: function toString() {
        var _ = this,
            str = '';

        str += _.value;

        return str;
    }
});

Token.tokens.literal = LiteralToken;

},{"./token":40}],34:[function(require,module,exports){
var Token = require('./token');

var OperatorToken = Token.generate(
    function OperatorToken(code) {
        var _ = this;

        if (code) {
            Token.call(_, code);
        }

        _.operator = '';

        _.operands = [];
    }
);


OperatorToken.definePrototype({
    enumerable: true
}, {
    type: 'operator'
});

OperatorToken.definePrototype({
    TYPE_ID: Token.tokens.push(OperatorToken) - 1,
    toArray: function () {
        var _ = this;
        return [
            _.TYPE_ID,
            _.operator,
            _.operands
        ];
    },

    toObject: function () {
        var _ = this;
        return {
            type: _.type,
            TYPE_ID: _.TYPE_ID,
            operator: _.operator,
            operands: _.operands
        };
    },

    _fromArray: function _fromArray(arr) {
        var _ = this;

        _.operator = arr[1];

        _.operands = arr[2].map(function (item) {
            var arg = new Token.tokens[item[0]]();

            arg.fromArray(item);

            return arg;
        });
    },

    toString: function toString() {
        var _ = this,
            str = '';

        if (_.operands.length === 1) {
            str += _.operator + _.operands[0].toString();
        } else if (_.operands.length === 2) {
            str += _.operands[0].toString();
            str += ' ' + _.operator + ' ';
            str += _.operands[1].toString();
        }

        return str;
    }
});

Token.tokens.operator = OperatorToken;
Token;

},{"./token":40}],35:[function(require,module,exports){
var Token = require('./token');

var PartialToken = Token.generate(
    function PartialToken(code) {
        var _ = this;

        if (code) {
            Token.call(_, code);
        }

        _.name = '';

        _.expression = null;
        _.map = null;
    }
);


PartialToken.definePrototype({
    enumerable: true
}, {
    type: 'partial'
});

PartialToken.definePrototype({
    TYPE_ID: Token.tokens.push(PartialToken) - 1,
    toArray: function () {
        var _ = this;
        return [
            _.TYPE_ID,
            _.name,
            _.expression,
            _.map
        ];
    },

    toObject: function () {
        var _ = this;
        return {
            type: _.type,
            TYPE_ID: _.TYPE_ID,
            name: _.name,
            expression: _.expression,
            map: _.map
        };
    },

    _fromArray: function _fromArray(arr) {
        var _ = this;

        _.name = arr[1];

        if (arr[2]) {
            var expression = new Token.tokens[arr[2][0]]();

            expression.fromArray(arr[2]);

            _.expression = expression;
        }

        _.map = arr[3].map(function (item) {
            var arg = new Token.tokens[item[0]]();

            arg.fromArray(item);

            return arg;
        });
    },
    toString: function toString() {
        var _ = this,
            str = _.indentLevel + '{{>' + _.name;
        str += (_.expression ? ' ' + _.expression.toString() : '');
        str += '}}';
        return str;
    }
});

Token.tokens.partial = PartialToken;

},{"./token":40}],36:[function(require,module,exports){
var Token = require('./token');
var PACKAGE_JSON = require('../../../package');

var ProgramToken = Token.generate(
    function ProgramToken(code) {
        var _ = this;

        if (code) {
            Token.call(_, code);
        }

        _.version = PACKAGE_JSON.version;
        _.mode = '';

        _.fragment = null;
    }
);

ProgramToken.definePrototype({
    enumerable: true
}, {
    type: 'program'
});

ProgramToken.definePrototype({
    writable: true
}, {
    indentLevel: '\n'
});

ProgramToken.definePrototype({
    TYPE_ID: Token.tokens.push(ProgramToken) - 1,
    toArray: function () {
        var _ = this;
        return [
            _.TYPE_ID,
            _.version,
            _.mode,
            _.fragment
        ];
    },

    toObject: function () {
        var _ = this;
        return {
            type: _.type,
            TYPE_ID: _.TYPE_ID,
            version: _.version,
            mode: _.mode,
            fragment: _.fragment
        };
    },

    _fromArray: function _fromArray(arr) {
        var _ = this;

        _.version = arr[1];
        _.mode = arr[2];

        var fragment = new Token.tokens.fragment();

        fragment.fromArray(arr[3]);

        _.fragment = fragment;
    },
    toString: function toString() {
        var _ = this;

        _.fragment.indentLevel = _.indentLevel;

        return _.fragment.toString()
            .trim() + '\n';
    }
});

Token.tokens.program = ProgramToken;

},{"../../../package":94,"./token":40}],37:[function(require,module,exports){
var Token = require('./token');

var PropToken = Token.generate(
    function PropToken(code) {
        var _ = this;

        if (code) {
            Token.call(_, code);
        }

        _.name = '';
        _.expression = null;
    }
);


PropToken.definePrototype({
    enumerable: true
}, {
    type: 'prop'
});

PropToken.definePrototype({
    TYPE_ID: Token.tokens.push(PropToken) - 1,
    toArray: function () {
        var _ = this;
        return [
            _.TYPE_ID,
            _.name,
            _.expression
        ];
    },

    toObject: function () {
        var _ = this;
        return {
            type: _.type,
            TYPE_ID: _.TYPE_ID,
            name: _.name,
            expression: _.expression
        };
    },

    _fromArray: function _fromArray(arr) {
        var _ = this;

        _.name = arr[1];

        var expression = new Token.tokens[arr[2][0]]();

        expression.fromArray(arr[2]);

        _.expression = expression;
    },

    toString: function toString() {
        var _ = this,
            str = _.name + ':{{ ';
        str += _.expression.toString();
        str += ' }}';
        return str;
    }
});

Token.tokens.prop = PropToken;

},{"./token":40}],38:[function(require,module,exports){
var Token = require('./token');

var TagToken = Token.generate(
    function TagToken(code) {
        var _ = this;

        if (code) {
            Token.call(_, code);
        }

        _.name = '';

        _.attrs = [];
        _.props = [];
        _.nodes = [];

        _.attrsUpdate = 0;
        _.nodesUpdate = 0;
    }
);


TagToken.definePrototype({
    enumerable: true
}, {
    type: 'tag'
});

TagToken.definePrototype({
    TYPE_ID: Token.tokens.push(TagToken) - 1,
    toArray: function () {
        var _ = this;
        return [
            _.TYPE_ID,
            _.name,
            _.attrs,
            _.attrsUpdate,
            _.nodes,
            _.nodesUpdate,
            _.props
        ];
    },

    toObject: function () {
        var _ = this;
        return {
            type: _.type,
            TYPE_ID: _.TYPE_ID,
            name: _.name,
            attrs: _.attrs,
            attrsUpdate: _.attrsUpdate,
            nodes: _.nodes,
            nodesUpdate: _.nodesUpdate,
            props: _.props
        };
    },

    _fromArray: function _fromArray(arr) {
        var _ = this;

        _.name = arr[1];

        _.attrs = arr[2].map(function (item) {
            var attr = new Token.tokens[item[0]]();

            attr.fromArray(item);

            return attr;
        });

        _.attrsUpdate = arr[3];

        _.nodes = arr[4].map(function (item) {
            var node = new Token.tokens[item[0]]();

            node.fromArray(item);

            return node;
        });

        _.nodesUpdate = arr[5];

        _.props = arr[6].map(function (item) {
            var prop = new Token.tokens[item[0]]();

            prop.fromArray(item);

            return prop;
        });
    },

    toString: function toString() {
        var _ = this,
            str = _.indentLevel + '<' + _.name;

        for (var i = 0; i < _.attrs.length; i++) {
            str += _.attrs[i].toString();
        }

        if (_.selfClosed) {
            str += (_.attrs.length ? ' ' : '') + '/>'; 
            return str;
        }

        str += '>'; 
        if (_.selfClosing) {
            return str;
        }
        var nodes = '';
        for (i = 0; i < _.nodes.length; i++) {
            _.nodes[i].indentLevel = (_.indentLevel ? _.indentLevel +
                '  ' : '');
            nodes += _.nodes[i].toString();
        }

        str += nodes.trim();

        str += _.indentLevel + '</' + _.name + '>';

        return str;
    },

    updates: function updates(type) {
        var _ = this;

        if (type === 'attr') {
            _.attrsUpdate = 1;
        } else {
            _.nodesUpdate = 1;
        }
    }
});

Token.tokens.tag = TagToken;

},{"./token":40}],39:[function(require,module,exports){
var Token = require('./token');

var TextToken = Token.generate(
    function TextToken(code) {
        var _ = this;

        if (code) {
            Token.call(_, code);
        }

        _.value = '';
    }
);


TextToken.definePrototype({
    enumerable: true
}, {
    type: 'text'
});

TextToken.definePrototype({
    TYPE_ID: Token.tokens.push(TextToken) - 1,
    toArray: function () {
        var _ = this;
        return [
            _.TYPE_ID,
            _.value
        ];
    },

    toObject: function () {
        var _ = this;
        return {
            type: _.type,
            TYPE_ID: _.TYPE_ID,
            value: _.value
        };
    },

    _fromArray: function _fromArray(arr) {
        var _ = this;

        _.value = arr[1];
    },

    toString: function toString() {
        var _ = this,
            str = '';

        str += _.indentLevel + _.value;

        return str;
    }
});

Token.tokens.text = TextToken;

},{"./token":40}],40:[function(require,module,exports){
var Token = require('compileit')
    .Token;

var BarsToken = Token.generate(
    function BarsToken(code, type) {
        Token.call(this, code, type);
    }
);

BarsToken.tokens = [];

BarsToken.definePrototype({
    writable: true
}, {
    indentLevel: '',
    // JSONuseObject: true
});

BarsToken.definePrototype({
    TYPE_ID: -1,

    toJSON: function toJSON(arr) {
        if (this.JSONuseObject)
            return this.toObject();
        return this.toArray();
    },

    toArray: function toArray() {
        var _ = this;

        console.warn('toArray not impleneted.');
        return [-1];
    },

    toObject: function toObject() {
        var _ = this;

        console.warn('toObject not impleneted.');
        return {
            type: _.type,
            TYPE_ID: _.TYPE_ID
        };
    },
    fromArray: function fromArray(arr) {
        var _ = this;
        if (arr[0] !== _.TYPE_ID) {
            throw 'TypeMismatch: ' + arr[0] + ' is not ' + _.TYPE_ID;
        }

        _._fromArray(arr);
    },
    updates: function updates() {
        var _ = this;
        console.warn('updates not impleneted.');
    }
});

module.exports = BarsToken;

},{"compileit":55}],41:[function(require,module,exports){
var Token = require('./token');

var TransformToken = Token.generate(
    function TransformToken(code) {
        var _ = this;

        if (code) {
            Token.call(_, code);
        }

        _.name = '';

        _.arguments = [];
    }
);


TransformToken.definePrototype({
    enumerable: true
}, {
    type: 'transform'
});

TransformToken.definePrototype({
    TYPE_ID: Token.tokens.push(TransformToken) - 1,
    toArray: function () {
        var _ = this;
        return [
            _.TYPE_ID,
            _.name,
            _.arguments
        ];
    },

    toObject: function () {
        var _ = this;
        return {
            type: _.type,
            TYPE_ID: _.TYPE_ID,
            name: _.name,
            arguments: _.arguments
        };
    },

    _fromArray: function _fromArray(arr) {
        var _ = this;

        _.name = arr[1];

        _.arguments = arr[2].map(function (item) {
            var arg = new Token.tokens[item[0]]();

            arg.fromArray(item);

            return arg;
        });
    },

    toString: function toString() {
        var _ = this,
            str = '@';

        str += _.name + '(';

        for (var i = 0; i < _.arguments.length; i++) {

            str += _.arguments[i].toString() + (i + 1 < _.arguments
                .length ?
                ', ' : '');
        }

        str += ')';

        return str;
    }
});

Token.tokens.transform = TransformToken;

},{"./token":40}],42:[function(require,module,exports){
var Token = require('./token');

var ValueToken = Token.generate(
    function ValueToken(code) {
        var _ = this;

        if (code) {
            Token.call(_, code);
        }

        _.path = '';
    }
);


ValueToken.definePrototype({
    enumerable: true
}, {
    type: 'value'
});

ValueToken.definePrototype({
    TYPE_ID: Token.tokens.push(ValueToken) - 1,
    toArray: function () {
        var _ = this;
        return [
            _.TYPE_ID,
            _.path
        ];
    },

    toObject: function () {
        var _ = this;
        return {
            type: _.type,
            TYPE_ID: _.TYPE_ID,
            path: _.path
        };
    },

    _fromArray: function _fromArray(arr) {
        var _ = this;

        _.path = arr[1];
    },

    toString: function toString() {
        var _ = this,
            str = '';

        if (
            _.path[0] === '~' ||
            _.path[0] === '..' ||
            _.path[0] === '.' ||
            _.path[0] === '@'
        ) {
            str += _.path.join('/');
        } else {
            str += _.path.join('.');
        }

        return str;
    }
});

Token.tokens.value = ValueToken;

},{"./token":40}],43:[function(require,module,exports){
module.exports={
    "quot":      34,
    "amp":       38,
    "lt":        60,
    "gt":        62,
    "nbsp":      160,
    "iexcl":     161,
    "cent":      162,
    "pound":     163,
    "curren":    164,
    "yen":       165,
    "brvbar":    166,
    "sect":      167,
    "uml":       168,
    "copy":      169,
    "ordf":      170,
    "laquo":     171,
    "not":       172,
    "shy":       173,
    "reg":       174,
    "macr":      175,
    "deg":       176,
    "plusmn":    177,
    "sup2":      178,
    "sup3":      179,
    "acute":     180,
    "micro":     181,
    "para":      182,
    "middot":    183,
    "cedil":     184,
    "sup1":      185,
    "ordm":      186,
    "raquo":     187,
    "frac14":    188,
    "frac12":    189,
    "frac34":    190,
    "iquest":    191,
    "Agrave":    192,
    "Aacute":    193,
    "Acirc":     194,
    "Atilde":    195,
    "Auml":      196,
    "Aring":     197,
    "AElig":     198,
    "Ccedil":    199,
    "Egrave":    200,
    "Eacute":    201,
    "Ecirc":     202,
    "Euml":      203,
    "Igrave":    204,
    "Iacute":    205,
    "Icirc":     206,
    "Iuml":      207,
    "ETH":       208,
    "Ntilde":    209,
    "Ograve":    210,
    "Oacute":    211,
    "Ocirc":     212,
    "Otilde":    213,
    "Ouml":      214,
    "times":     215,
    "Oslash":    216,
    "Ugrave":    217,
    "Uacute":    218,
    "Ucirc":     219,
    "Uuml":      220,
    "Yacute":    221,
    "THORN":     222,
    "szlig":     223,
    "agrave":    224,
    "aacute":    225,
    "acirc":     226,
    "atilde":    227,
    "auml":      228,
    "aring":     229,
    "aelig":     230,
    "ccedil":    231,
    "egrave":    232,
    "eacute":    233,
    "ecirc":     234,
    "euml":      235,
    "igrave":    236,
    "iacute":    237,
    "icirc":     238,
    "iuml":      239,
    "eth":       240,
    "ntilde":    241,
    "ograve":    242,
    "oacute":    243,
    "ocirc":     244,
    "otilde":    245,
    "ouml":      246,
    "divide":    247,
    "oslash":    248,
    "ugrave":    249,
    "uacute":    250,
    "ucirc":     251,
    "uuml":      252,
    "yacute":    253,
    "thorn":     254,
    "euro":      8364
}

},{}],44:[function(require,module,exports){
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

},{"../tokens":31,"./html-entities":43,"./self-closing-tags":45}],45:[function(require,module,exports){
module.exports=[
    "area",
    "base",
    "br",
    "col",
    "command",
    "embed",
    "hr",
    "img",
    "input",
    "keygen",
    "link",
    "meta",
    "param",
    "source",
    "track",
    "wbr"
]

},{}],46:[function(require,module,exports){
module.exports = require('./bars');

},{"./bars":3}],47:[function(require,module,exports){
var h = require('virtual-dom/h');
var execute = require('../runtime/execute');

function makeVars(context, map, bars) {
    var vars = {};
    for (var i = 0; i < map.length; i++) {
        vars[map[i].name] = execute(map[i].expression, bars.transforms, context);
    }
    return vars;
}

function renderTextNode(bars, struct, context) {
    return struct.value;
}

var PROP_MAP = {
    'class': 'className'
};

function renderAttrsAndProps(bars, struct, context) {
    var i,
        props = {
            data: {}
        },
        attrs = {};

    for (i = 0; i < struct.attrs.length; i++) {
        var attr = struct.attrs[i];
        attrs[attr.name] = renderChildrenTexts(bars, attr, context);
    }

    for (i = 0; i < struct.props.length; i++) {
        props.data[struct.props[i].name] = execute(struct.props[i].expression, bars.transforms,
            context);
    }

    props.attributes = attrs;
    // var key = context.lookup(['@', 'key']);
    // props.key = /[^0-9]/.test(key) ? key : context.lookup(['id']); What is this supposed to do?

    return props;
}

function renderInsert(bars, struct, context) {
    return execute(struct.expression, bars.transforms, context);
}

function renderChildrenTexts(bars, struct, context) {
    var children = [];
    if (!struct || !struct.nodes) return children.join('');
    for (var i = 0; i < struct.nodes.length; i++) {
        var child = struct.nodes[i];

        if (child.type === 'text') {
            children.push(child.value);
        } else if (child.type === 'insert') {
            children.push(renderInsert(bars, child, context));
        } else if (child.type === 'block') {
            children.push(renderBlockAsTexts(bars, child, context));
        }
    }

    return children.join('');
}

function renderBlockAsTexts(bars, struct, context) {
    var nodes = [];

    function consequent(new_context) {
        new_context = new_context || context;
        new_context = new_context.contextWithVars(makeVars(new_context, struct.map, bars));
        nodes.push(renderTypeAsTexts(bars, struct.consequent, new_context));
    }

    function alternate(new_context) {
        if (new_context) {
            new_context = new_context.contextWithVars(makeVars(new_context, struct.map, bars));
        }
        nodes.push(renderTypeAsTexts(bars, struct.alternate, new_context || context));
    }

    var blockFunc = bars.blocks[struct.name];

    if (typeof blockFunc !== 'function') {
        throw 'Missing Block helper: ' + struct.name;
    }

    blockFunc(
        struct.arguments.map(function (expression) {
            return execute(expression, bars.transforms, context);
        }),
        consequent,
        alternate,
        context
    );

    return nodes.join('');
}

function renderBlockAsNodes(bars, struct, context) {
    var nodes = [];

    function consequent(new_context) {
        new_context = new_context || context;
        new_context = new_context.contextWithVars(makeVars(new_context, struct.map, bars));
        nodes = nodes.concat(renderTypeAsNodes(bars, struct.consequent, new_context));
    }

    function alternate(new_context) {
        if (new_context) {
            new_context = new_context.contextWithVars(makeVars(new_context, struct.map, bars));
        }
        nodes = nodes.concat(renderTypeAsNodes(bars, struct.alternate, new_context || context));
    }

    var blockFunc = bars.blocks[struct.name];

    if (typeof blockFunc !== 'function') {
        throw 'Missing Block helper: ' + struct.name;
    }

    blockFunc(
        struct.arguments.map(function (expression) {
            return execute(expression, bars.transforms, context);
        }),
        consequent,
        alternate,
        context
    );

    return nodes;
}

function renderPartial(bars, struct, context) {
    var name = struct.name;
    if (typeof struct.name === 'object') {
        name = execute(struct.name, bars.transforms, context);
    }

    var partial = bars.partials[name];

    if (struct.expression) {
        context = context.newContext(
            execute(struct.expression, bars.transforms, context),
            null,
            true
        );
    }

    context = context.contextWithVars(makeVars(context, struct.map, bars));

    return renderChildrenNodes(bars, partial.fragment, context);
}

function renderChildrenNodes(bars, struct, context) {
    var children = [];
    if (!struct || !struct.nodes) return children;
    for (var i = 0; i < struct.nodes.length; i++) {
        var child = struct.nodes[i];

        if (child.type === 'tag') {
            children.push(renderTagNode(bars, child, context));
        } else if (child.type === 'text') {
            children.push(renderTextNode(bars, child, context));
        } else if (child.type === 'insert') {
            children.push(renderInsert(bars, child, context));
        } else if (child.type === 'block') {
            children = children.concat(renderBlockAsNodes(bars, child, context));
        } else if (child.type === 'partial') {
            children = children.concat(renderPartial(bars, child, context));
        }
    }

    return children;
}

function renderTagNode(bars, struct, context) {
    return h(
        struct.name,
        renderAttrsAndProps(bars, struct, context),
        renderChildrenNodes(bars, struct, context)
    );
}

function renderTypeAsNodes(bars, struct, context) {
    if (!struct) return [];
    if (struct.type === 'tag') {
        return [renderTagNode(bars, struct, context)];
    } else if (struct.type === 'text') {
        return [renderTextNode(bars, struct, context)];
    } else if (struct.type === 'insert') {
        return [renderInsert(bars, struct, context)];
    } else if (struct.type === 'block') {
        return renderBlockAsNodes(bars, struct, context);
    } else if (struct.type === 'fragment') {
        return renderChildrenNodes(bars, struct, context);
    } else if (struct.type === 'partial') {
        return renderPartial(bars, struct, context);
    }

    throw 'unknown type: ' + struct.type;
}

function renderTypeAsTexts(bars, struct, context) {
    if (!struct) return [];
    if (struct.type === 'text') {
        return struct.value;
    } else if (struct.type === 'insert') {
        return renderInsert(bars, struct, context);
    } else if (struct.type === 'block') {
        return renderBlockAsTexts(bars, struct, context);
    } else if (struct.type === 'fragment') {
        return renderChildrenTexts(bars, struct, context);
    }
    throw 'unknown type: ' + struct.type;
}

function render(bars, struct, context) {
    return h(
        'div', {
            key: struct.fragment.key
        },
        renderChildrenNodes(bars, struct.fragment, context)
    );
}

module.exports = render;

},{"../runtime/execute":50,"virtual-dom/h":69}],48:[function(require,module,exports){
var Generator = require('generate-js');
var ContextN = require('./runtime/context-n');
var renderV = require('./render/render');

var diff = require('virtual-dom/diff');
var patch = require('virtual-dom/patch');
var createElement = require('virtual-dom/create-element');

var Renderer = Generator.generate(function Renderer(bars, struct, state) {
    var _ = this;

    _.bars = bars;
    _.struct = struct;
    _.tree = renderV(_.bars, _.struct, new ContextN(state));
    _.rootNode = createElement(_.tree);
});

Renderer.definePrototype({
    update: function update(state) {
        var _ = this;

        var newTree = renderV(_.bars, _.struct, new ContextN(state));
        var patches = diff(_.tree, newTree);
        patch(_.rootNode, patches);
        _.tree = newTree;
    },
    appendTo: function appendTo(el) {
        var _ = this;

        el.appendChild(_.rootNode);
    }
});

module.exports = Renderer;

},{"./render/render":47,"./runtime/context-n":49,"generate-js":62,"virtual-dom/create-element":67,"virtual-dom/diff":68,"virtual-dom/patch":70}],49:[function(require,module,exports){
var Generator = require('generate-js');

var Context = Generator.generate(function Context(data, props, context, cleanVars) {
    var _ = this;

    _.data = data;
    _.props = props;
    _.context = context;

    if (cleanVars || !context) {
        _.vars = Object.create(null);
    } else {
        _.vars = Object.create(context.vars);
    }

});

Context.definePrototype({
    lookup: function lookup(path, prop) {
        var _ = this,
            i = 0;

        if (path[0] === '@') {
            prop = true;
            path = path.slice(1);
        }

        if (path[0] === '~' && _.context) {
            return _.context.lookup(path, prop);
        }

        if (path[0] === '..' && _.context) {
            return _.context.lookup(
                path.slice(1), prop
            );
        }

        if (
            path[0] === 'this' ||
            path[0] === '.' ||
            path[0] === '~'
        ) {
            i = 1;
        }

        var value;

        if (!prop &&
            path.length &&
            path[0] !== 'this' &&
            path[0] !== '.' &&
            path[0] !== '~'
        ) {
            value = _.vars;

            for (i = 0; value && i < path.length; i++) {

                if (value !== null && value !== void(0)) {
                    value = value[path[i]];
                } else {
                    value = void(0);
                }
            }

            if (value !== void(0)) {
                return value;
            }
        }

        value = (prop ? _.props : _.data);

        for (i = 0; value && i < path.length; i++) {

            if (value !== null && value !== void(0)) {
                value = value[path[i]];
            } else {
                value = void(0);
            }
        }

        return value;
    },
    newContext: function newContext(data, props, cleanVars) {
        return new Context(data, props, this, cleanVars);
    },
    contextWithVars: function contextWithVars(vars) {
        var _ = this;

        var context = new Context(_.data, _.props, _);

        context.setVars(vars);

        return context;
    },
    setVars: function setVars(vars) {
        var _ = this;

        for (var v in vars) {
            if (vars.hasOwnProperty(v)) {
                _.vars[v] = vars[v];
            }
        }
    }
});

module.exports = Context;

},{"generate-js":62}],50:[function(require,module,exports){
var logic = require('./logic');

function execute(syntaxTree, transforms, context) {
    function run(token) {
        var result,
            args = [];
        // console.log('>>>>', token)
        if (
            token.type === 'literal'
        ) {
            result = token.value;
        } else if (
            token.type === 'value'
        ) {
            // console.log(token.path);
            result = context.lookup(token.path);
            // console.log(result);
        } else if (
            token.type === 'operator' &&
            token.operands.length === 1
        ) {
            result = logic[token.operator](
                run(token.operands[0])
            );
        } else if (
            token.type === 'operator' &&
            token.operands.length === 2
        ) {
            if (token.operator === '||') {
                result = run(token.operands[0]) || run(token.operands[1]);
            } else if (token.operator === '&&') {
                result = run(token.operands[0]) && run(token.operands[1]);
            } else {
                result = logic[token.operator](
                    run(token.operands[0]),
                    run(token.operands[1])
                );
            }
        } else if (
            token.type === 'transform'
        ) {
            for (var i = 0; i < token.arguments.length; i++) {
                args.push(run(token.arguments[i]));
            }
            if (transforms[token.name] instanceof Function) {
                result = transforms[token.name].apply(null, args);
            } else {
                throw 'Missing Transfrom: "' + token.name + '".';
            }
        }
        // console.log('<<<<', result)
        return result;
    }

    if (syntaxTree) {
        return run(syntaxTree);
    } else {
        return context.lookup('.');
    }
}

module.exports = execute;

},{"./logic":51}],51:[function(require,module,exports){
/* Arithmetic */
exports.add      = function add      (a, b) { return a + b; };
exports.subtract = function subtract (a, b) { return a - b; };
exports.multiply = function multiply (a, b) { return a * b; };
exports.devide   = function devide   (a, b) { return a / b; };
exports.mod      = function mod      (a, b) { return a % b; };

exports['+'] = exports.add;
exports['-'] = exports.subtract;
exports['*'] = exports.multiply;
exports['/'] = exports.devide;
exports['%'] = exports.mod;

/* Logic */

exports.not = function not (a) { return !a; };

exports['!'] = exports.not;

exports.or        = function or         (a, b) { return a || b; };
exports.and       = function and        (a, b) { return a && b; };

exports['||'] = exports.or;
exports['&&'] = exports.and;

/* Comparison */

exports.strictequals    = function strictequals     (a, b) { return a === b; };
exports.strictnotequals = function strictnotequals  (a, b) { return a !== b; };

exports['==='] = exports.strictequals;
exports['!=='] = exports.strictnotequals;

exports.equals    = function equals     (a, b) { return a == b; };
exports.notequals = function notequals  (a, b) { return a != b; };
exports.ltequals  = function ltequals   (a, b) { return a <= b; };
exports.gtequals  = function gtequals   (a, b) { return a >= b; };

exports['=='] = exports.equals;
exports['!='] = exports.notequals;
exports['<='] = exports.ltequals;
exports['>='] = exports.gtequals;

exports.lt = function lt (a, b) { return a < b; };
exports.gt = function gt (a, b) { return a > b; };

exports['<'] = exports.lt;
exports['>'] = exports.gt;

},{}],52:[function(require,module,exports){
var Generator = require('generate-js');

var Transform = Generator.generate(function Transform() {});

Transform.definePrototype({
    log: function log() {
        var args = Array.prototype.slice.call(arguments);
        args.unshift('Bars:');
        console.log.apply(console, args);
    },
    upperCase: function upperCase(a) {
        return String(a)
            .toUpperCase();
    },
    lowerCase: function lowerCase(a) {
        return String(a)
            .toLowerCase();
    },
    number: function number(a) {
        return Number(a);
    },
    string: function string(a) {
        return String(a);
    },
    reverse: function reverse(arr) {
        return arr.slice()
            .reverse();
    },
    slice: function (arr, start, end) {
        return arr.slice(start, end);
    },
    map: function map(arr, prop) {
        return arr.map(function (item) {
            return arr[prop];
        });
    },
    sort: function sort(arr, key) {
        return arr.slice()
            .sort(function (a, b) {
                if (key) {
                    if (a[key] < b[key]) return -1;
                    if (a[key] > b[key]) return 1;
                    return 0;
                }

                if (a < b) return -1;
                if (a > b) return 1;
                return 0;
            });
    },
    sum: function sum(arr, key) {
        var sum = 0,
            i;
        if (key) {
            for (i = 0; i < arr.length; i++) {
                sum += arr[i][key];
            }
        } else {
            for (i = 0; i < arr.length; i++) {
                sum += arr[i];
            }
        }

        return sum;
    },
    ave: function ave(arr, key) {
        var sum = 0,
            i;
        if (key) {
            for (i = 0; i < arr.length; i++) {
                sum += arr[i][key];
            }
        } else {
            for (i = 0; i < arr.length; i++) {
                sum += arr[i];
            }
        }

        return sum / arr.length;
    }
});

module.exports = Transform;

},{"generate-js":62}],53:[function(require,module,exports){
/*!
 * Cross-Browser Split 1.1.1
 * Copyright 2007-2012 Steven Levithan <stevenlevithan.com>
 * Available under the MIT License
 * ECMAScript compliant, uniform cross-browser split method
 */

/**
 * Splits a string into an array of strings using a regex or string separator. Matches of the
 * separator are not included in the result array. However, if `separator` is a regex that contains
 * capturing groups, backreferences are spliced into the result each time `separator` is matched.
 * Fixes browser bugs compared to the native `String.prototype.split` and can be used reliably
 * cross-browser.
 * @param {String} str String to split.
 * @param {RegExp|String} separator Regex or string to use for separating the string.
 * @param {Number} [limit] Maximum number of items to include in the result array.
 * @returns {Array} Array of substrings.
 * @example
 *
 * // Basic use
 * split('a b c d', ' ');
 * // -> ['a', 'b', 'c', 'd']
 *
 * // With limit
 * split('a b c d', ' ', 2);
 * // -> ['a', 'b']
 *
 * // Backreferences in result array
 * split('..word1 word2..', /([a-z]+)(\d+)/i);
 * // -> ['..', 'word', '1', ' ', 'word', '2', '..']
 */
module.exports = (function split(undef) {

  var nativeSplit = String.prototype.split,
    compliantExecNpcg = /()??/.exec("")[1] === undef,
    // NPCG: nonparticipating capturing group
    self;

  self = function(str, separator, limit) {
    // If `separator` is not a regex, use `nativeSplit`
    if (Object.prototype.toString.call(separator) !== "[object RegExp]") {
      return nativeSplit.call(str, separator, limit);
    }
    var output = [],
      flags = (separator.ignoreCase ? "i" : "") + (separator.multiline ? "m" : "") + (separator.extended ? "x" : "") + // Proposed for ES6
      (separator.sticky ? "y" : ""),
      // Firefox 3+
      lastLastIndex = 0,
      // Make `global` and avoid `lastIndex` issues by working with a copy
      separator = new RegExp(separator.source, flags + "g"),
      separator2, match, lastIndex, lastLength;
    str += ""; // Type-convert
    if (!compliantExecNpcg) {
      // Doesn't need flags gy, but they don't hurt
      separator2 = new RegExp("^" + separator.source + "$(?!\\s)", flags);
    }
    /* Values for `limit`, per the spec:
     * If undefined: 4294967295 // Math.pow(2, 32) - 1
     * If 0, Infinity, or NaN: 0
     * If positive number: limit = Math.floor(limit); if (limit > 4294967295) limit -= 4294967296;
     * If negative number: 4294967296 - Math.floor(Math.abs(limit))
     * If other: Type-convert, then use the above rules
     */
    limit = limit === undef ? -1 >>> 0 : // Math.pow(2, 32) - 1
    limit >>> 0; // ToUint32(limit)
    while (match = separator.exec(str)) {
      // `separator.lastIndex` is not reliable cross-browser
      lastIndex = match.index + match[0].length;
      if (lastIndex > lastLastIndex) {
        output.push(str.slice(lastLastIndex, match.index));
        // Fix browsers whose `exec` methods don't consistently return `undefined` for
        // nonparticipating capturing groups
        if (!compliantExecNpcg && match.length > 1) {
          match[0].replace(separator2, function() {
            for (var i = 1; i < arguments.length - 2; i++) {
              if (arguments[i] === undef) {
                match[i] = undef;
              }
            }
          });
        }
        if (match.length > 1 && match.index < str.length) {
          Array.prototype.push.apply(output, match.slice(1));
        }
        lastLength = match[0].length;
        lastLastIndex = lastIndex;
        if (output.length >= limit) {
          break;
        }
      }
      if (separator.lastIndex === match.index) {
        separator.lastIndex++; // Avoid an infinite loop
      }
    }
    if (lastLastIndex === str.length) {
      if (lastLength || !separator.test("")) {
        output.push("");
      }
    } else {
      output.push(str.slice(lastLastIndex));
    }
    return output.length > limit ? output.slice(0, limit) : output;
  };

  return self;
})();

},{}],54:[function(require,module,exports){

},{}],55:[function(require,module,exports){
exports.Compiler = require('./lib/compiler');
exports.Token = require('./lib/token');

},{"./lib/compiler":57,"./lib/token":59}],56:[function(require,module,exports){
var Generator = require('generate-js'),
    utils = require('./utils');

var CodeBuffer = Generator.generate(
    function CodeBuffer(str, file) {
        var _ = this;

        _.reset();
        _._buffer = str;
        _._file = file;
    }
);

CodeBuffer.definePrototype({
    reset: function reset() {
        var _ = this;

        _.line = 1;
        _.column = 1;
        _._index = 0;
        _._currentLine = 0;
    },
    currentLine: {
        get: function currentLine() {
            var _ = this,
                lineText = '',
                i = _._currentLine;

            while (i < _.length) {
                lineText += _._buffer[i];
                if (_._buffer.codePointAt(i) === 10) {
                    break;
                }
                i++;
            }

            return lineText;
        }
    },

    buffer: {
        get: function getBuffer() {
            var _ = this;

            return _._buffer;
        }
    },


    index: {
        get: function getIndex() {
            var _ = this;

            return _._index;
        },

        set: function setIndex(val) {
            var _ = this,
                i = _._index,
                update = false;

            val = Math.min(_.length, val);
            val = Math.max(0, val);

            if (i == val) return;

            if (i > val) {
                // throw new Error('========' + val + ' < ' +i+'=======');
                _.reset();
                i = _._index;
            }

            if (_.buffer.codePointAt(i) === 10) {
                update = true;
                i++;
            }

            for (; i <= val; i++) {
                if (update) {
                    _._currentLine = i;
                    _.line++;
                    update = false;
                } else {
                    _.column++;
                }

                if (_.buffer.codePointAt(i) === 10) {
                    update = true;
                }
            }
            _.column = val - _._currentLine + 1;
            _._index = val;
        }
    },

    length: {
        get: function getLength() {
            var _ = this;

            return _._buffer.length;
        }
    },

    next: function next() {
        var _ = this;

        _.index++;
        return _.charAt(_.index);
    },

    left: {
        get: function getLeft() {
            var _ = this;

            return _._index < _.length;
        }
    },

    charAt: function charAt(i) {
        var _ = this;

        return _._buffer[i] || 'EOF';
    },

    codePointAt: function codePointAt(i) {
        var _ = this;

        return _._buffer.codePointAt(i);
    },

    slice: function slice(startIndex, endIndex) {
        var _ = this;

        return _._buffer.slice(startIndex, endIndex);
    },

    makeError: function makeError(start, end, message) {
        var _ = this;

        utils.assertTypeError(start, 'number');
        utils.assertTypeError(end, 'number');
        utils.assertTypeError(message, 'string');

        _.index = start;

        var currentLine = _.currentLine,
            tokenLength = end - start,
            tokenIdentifier =
            currentLine[currentLine.length - 1] === '\n' ? '' :
            '\n',
            i;

        for (i = 1; i < _.column; i++) {
            tokenIdentifier += ' ';
        }

        tokenLength = Math.min(
            tokenLength,
            currentLine.length - tokenIdentifier.length
        ) || 1;

        for (i = 0; i < tokenLength; i++) {
            tokenIdentifier += '^';
        }

        return 'Syntax Error: ' +
            message +
            ' at ' +
            (_._file ? _._file + ':' : '') +
            _.line +
            ':' +
            _.column +
            '\n\n' +
            currentLine +
            tokenIdentifier +
            '\n';
    }
});

module.exports = CodeBuffer;

},{"./utils":60,"generate-js":62}],57:[function(require,module,exports){
var Generator = require('generate-js'),
    Scope = require('./scope'),
    Token = require('./token'),
    CodeBuffer = require('./code-buffer'),
    utils = require('./utils');

var Compiler = Generator.generate(
    function Compiler(parseModes, formaters) {
        var _ = this;

        _.modeFormater = formaters.modeFormater || utils.varThrough;
        _.charFormater = formaters.charFormater || utils.varThrough;
        _.funcFormater = formaters.funcFormater || utils.varThrough;
        _.typeFormater = formaters.typeFormater || utils.varThrough;
        _.sourceFormater = formaters.sourceFormater || utils.varThrough;

        _.parseModes = parseModes;
        _.scope = new Scope();
    }
);

Compiler.definePrototype({
    compile: function compile(codeStr, file, mode, flags) {
        var _ = this,
            tokens = [];

        _.codeBuffer = new CodeBuffer(codeStr, file);

        _.scope.verbose = flags.verbose;

        if (flags.verbose) {
            _.scope.printScope();
        }

        _.parseMode(mode, tokens, flags);

        if (flags.verbose) {
            _.scope.printScope();
        }

        if (_.scope.length) {
            throw _.codeBuffer.makeError(
                'Unexpected End Of Input.'
            );
        }

        return tokens;
    },

    parseMode: function parseMode(mode, tokens, flags) {
        var _ = this,
            scope = _.scope,
            code = _.codeBuffer,
            token,
            parseFuncs = _.parseModes[mode],
            index = code.index;

        if (!parseFuncs) {
            throw new Error('Mode not found: ' + JSON.stringify(
                mode) + '.');
        }

        function newParseMode(mode, tokens, flags) {
            _.parseMode(mode, tokens, flags);
        }

        newParseMode.close = function () {
            this.closed = true;
        };

        loop: while (code.left) {

            for (var i = 0; i < parseFuncs.length; i++) {
                var parseFunc = parseFuncs[i];

                if (flags.verbose) {
                    console.log(
                        utils.repeat('  ', scope.length +
                            1) +
                        _.modeFormater(mode) + ' ' +
                        _.funcFormater(parseFunc.name) +
                        '\n' +
                        utils.repeat('  ', scope.length +
                            1) +
                        utils.bufferSlice(code, 5, _.charFormater)
                    );
                }

                token = parseFunc(
                    mode,
                    code,
                    tokens,
                    flags,
                    scope,
                    newParseMode
                );

                if (token) {
                    if (token instanceof Token) {
                        tokens.push(token);

                        if (flags.verbose) {
                            console.log(
                                utils.repeat('  ', scope.length +
                                    1) +
                                _.typeFormater(token.constructor
                                    .name || token.type) +
                                ': ' +
                                _.sourceFormater(token.source())
                            );
                        }
                    }

                    if (newParseMode.closed) {
                        delete newParseMode.closed;
                        break loop;
                    }

                    break;
                }
            }

            if (newParseMode.closed) {
                delete newParseMode.closed;
                break loop;
            }

            if (index === code.index) {
                token = new Token(code);
                token.close(code);
                token.value = token.source(code);

                if (flags.noErrorOnILLEGAL) {
                    tokens.push(token);
                } else {
                    throw code.makeError(
                        token.range[0],
                        token.range[1],
                        'ILLEGAL Token: ' +
                        JSON.stringify(
                            token.source(code)
                        )
                        .slice(1, -1)
                    );
                }
            }

            index = code.index;
        }
    }
});

module.exports = Compiler;

},{"./code-buffer":56,"./scope":58,"./token":59,"./utils":60,"generate-js":62}],58:[function(require,module,exports){
var Generator = require('generate-js'),
    Token = require('./token'),
    utils = require('./utils');

var Scope = Generator.generate(
    function Scope() {
        var _ = this;

        _.defineProperties({
            _scope: []
        });
    }
);

Scope.definePrototype({
    push: function push(token) {
        var _ = this;

        utils.assertError(Token.isCreation(token), 'Invalid Type.');

        _._scope.push(token);

        if (_.verbose) {
            _.printScope();
        }

        return _._scope.length;
    },
    pop: function pop() {
        var _ = this;

        var token = _._scope.pop();

        if (_.verbose) {
            _.printScope();
        }

        return token;
    },
    close: function close() {
        var _ = this;

        var token = _._scope.pop();

        token.close();

        if (_.verbose) {
            _.printScope();
        }

        return token;
    },
    printScope: function printScope() {
        var _ = this;

        console.log(
            ['Main'].concat(
                _._scope
                .map(function (item) {
                    return item.constructor.name ||
                        item.type;
                })
            )
            .join(' => ')
        );
    },
    token: {
        get: function getToken() {
            var _ = this;

            return _._scope[_._scope.length - 1];
        }
    },
    length: {
        get: function getLength() {
            var _ = this;

            return _._scope.length;
        }
    }
});

module.exports = Scope;

},{"./token":59,"./utils":60,"generate-js":62}],59:[function(require,module,exports){
var Generator = require('generate-js'),
    utils = require('./utils');

var Token = Generator.generate(
    function Token(code, type) {
        var _ = this;

        _.defineProperties({
            code: code
        });

        _.type = type;
        _.range = [code.index, code.index + 1];
        _.loc = {
            start: {
                line: code.line,
                column: code.column
            },
            end: {
                line: code.line,
                column: code.column + 1
            }
        };
    }
);

Token.definePrototype({
    writable: true,
    enumerable: true
}, {
    type: 'ILLEGAL'
});

Token.definePrototype({
    length: {
        get: function getLength() {
            return this.range[1] - this.range[0];
        }
    },
    source: function source() {
        var _ = this;
        return _.code.slice(_.range[0], _.range[1]);
    },
    close: function close() {
        var _ = this;

        if (_.closed) {
            throw new Error('Cannot call close on a closed token.');
        }

        _.closed = true;

        if (_.code.index > _.range[1]) {
            _.range[1] = _.code.index;
            _.loc.end = {
                line: _.code.line,
                column: _.code.column
            };
        }
    }
});

module.exports = Token;

},{"./utils":60,"generate-js":62}],60:[function(require,module,exports){
/**
 * Assert Error function.
 * @param  {Boolean} condition Whether or not to throw error.
 * @param  {String} message    Error message.
 */
function assertError(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}
exports.assertError = assertError;

/**
 * Assert TypeError function.
 * @param  {Boolean} condition Whether or not to throw error.
 * @param  {String} message    Error message.
 */
function assertTypeError(test, type) {
    if (typeof test !== type) {
        throw new TypeError('Expected \'' + type +
            '\' but instead found \'' +
            typeof test + '\'');
    }
}
exports.assertTypeError = assertTypeError;

/**
 * Repeats a string `n` time.
 * @param  {String} str String to be repeated.
 * @param  {Number} n   Number of times to repeat.
 */
function repeat(str, n) {
    var result = '';

    for (var i = 0; i < n; i++) {
        result += str;
    }

    return result;
}
exports.repeat = repeat;

/**
 * Returns whatever you pass it.
 * @param  {Any} a CodeBuffer to slice.
 */
function varThrough(a) {
    return a;
}
exports.varThrough = varThrough;

/**
 * Stringified CodeBuffer slice.
 * @param  {CodeBuffer} code CodeBuffer to slice.
 * @param  {Number} range    Range to slice before and after `code.index`.
 */
function bufferSlice(code, range, format) {
    format = format || varThrough;
    return JSON.stringify(
            code.slice(Math.max(0, code.index - range), code.index)
        )
        .slice(1, -1) +
        format(
            JSON.stringify(code.charAt(code.index) || 'EOF')
            .slice(1, -1)
        ) +
        JSON.stringify(
            code.slice(
                code.index + 1,
                Math.min(code.length, code.index + 1 + range)
            )
        )
        .slice(1, -1);
}
exports.bufferSlice = bufferSlice;

},{}],61:[function(require,module,exports){
'use strict';

var OneVersionConstraint = require('individual/one-version');

var MY_VERSION = '7';
OneVersionConstraint('ev-store', MY_VERSION);

var hashKey = '__EV_STORE_KEY@' + MY_VERSION;

module.exports = EvStore;

function EvStore(elem) {
    var hash = elem[hashKey];

    if (!hash) {
        hash = elem[hashKey] = {};
    }

    return hash;
}

},{"individual/one-version":65}],62:[function(require,module,exports){
/**
 * @name generate.js
 * @author Michaelangelo Jong
 */

(function GeneratorScope() {
    /**
     * Assert Error function.
     * @param  {Boolean} condition Whether or not to throw error.
     * @param  {String} message    Error message.
     */
    function assertError(condition, message) {
        if (!condition) {
            throw new Error(message);
        }
    }

    /**
     * Assert TypeError function.
     * @param  {Boolean} condition Whether or not to throw error.
     * @param  {String} message    Error message.
     */
    function assertTypeError(test, type) {
        if (typeof test !== type) {
            throw new TypeError('Expected \'' + type +
                '\' but instead found \'' +
                typeof test + '\'');
        }
    }

    /**
     * Returns the name of function 'func'.
     * @param  {Function} func Any function.
     * @return {String}        Name of 'func'.
     */
    function getFunctionName(func) {
        if (func.name !== void(0)) {
            return func.name;
        }
        // Else use IE Shim
        var funcNameMatch = func.toString()
            .match(/function\s*([^\s]*)\s*\(/);
        func.name = (funcNameMatch && funcNameMatch[1]) || '';
        return func.name;
    }

    /**
     * Returns true if 'obj' is an object containing only get and set functions, false otherwise.
     * @param  {Any} obj Value to be tested.
     * @return {Boolean} true or false.
     */
    function isGetSet(obj) {
        var keys, length;
        if (obj && typeof obj === 'object') {
            keys = Object.getOwnPropertyNames(obj)
                .sort();
            length = keys.length;

            if ((length === 1 && (keys[0] === 'get' && typeof obj.get ===
                    'function' ||
                    keys[0] === 'set' && typeof obj.set === 'function'
                )) ||
                (length === 2 && (keys[0] === 'get' && typeof obj.get ===
                    'function' &&
                    keys[1] === 'set' && typeof obj.set === 'function'
                ))) {
                return true;
            }
        }
        return false;
    }

    /**
     * Defines properties on 'obj'.
     * @param  {Object} obj        An object that 'properties' will be attached to.
     * @param  {Object} descriptor Optional object descriptor that will be applied to all attaching properties on 'properties'.
     * @param  {Object} properties An object who's properties will be attached to 'obj'.
     * @return {Generator}         'obj'.
     */
    function defineObjectProperties(obj, descriptor, properties) {
        var setProperties = {},
            i,
            keys,
            length,

            p = properties || descriptor,
            d = properties && descriptor;

        properties = (p && typeof p === 'object') ? p : {};
        descriptor = (d && typeof d === 'object') ? d : {};

        keys = Object.getOwnPropertyNames(properties);
        length = keys.length;

        for (i = 0; i < length; i++) {
            if (isGetSet(properties[keys[i]])) {
                setProperties[keys[i]] = {
                    configurable: !!descriptor.configurable,
                    enumerable: !!descriptor.enumerable,
                    get: properties[keys[i]].get,
                    set: properties[keys[i]].set
                };
            } else {
                setProperties[keys[i]] = {
                    configurable: !!descriptor.configurable,
                    enumerable: !!descriptor.enumerable,
                    writable: !!descriptor.writable,
                    value: properties[keys[i]]
                };
            }
        }
        Object.defineProperties(obj, setProperties);
        return obj;
    }



    var Creation = {
        /**
         * Defines properties on this object.
         * @param  {Object} descriptor Optional object descriptor that will be applied to all attaching properties.
         * @param  {Object} properties An object who's properties will be attached to this object.
         * @return {Object}            This object.
         */
        defineProperties: function defineProperties(descriptor,
            properties) {
            defineObjectProperties(this, descriptor,
                properties);
            return this;
        },

        /**
         * returns the prototype of `this` Creation.
         * @return {Object} Prototype of `this` Creation.
         */
        getProto: function getProto() {
            return Object.getPrototypeOf(this);
        },

        /**
         * returns the prototype of `this` super Creation.
         * @return {Object} Prototype of `this` super Creation.
         */
        getSuper: function getSuper() {
            return Object.getPrototypeOf(this.constructor.prototype);
        }
    };

    var Generation = {
        /**
         * Returns true if 'generator' was generated by this Generator.
         * @param  {Generator} generator A Generator.
         * @return {Boolean}             true or false.
         */
        isGeneration: function isGeneration(generator) {
            assertTypeError(generator, 'function');

            var _ = this;

            return _.prototype.isPrototypeOf(generator.prototype);
        },

        /**
         * Returns true if 'object' was created by this Generator.
         * @param  {Object} object An Object.
         * @return {Boolean}       true or false.
         */
        isCreation: function isCreation(object) {
            var _ = this;
            return object instanceof _;
        },
        /**
         * Generates a new generator that inherits from `this` generator.
         * @param {Generator} ParentGenerator Generator to inherit from.
         * @param {Function} create           Create method that gets called when creating a new instance of new generator.
         * @return {Generator}                New Generator that inherits from 'ParentGenerator'.
         */
        generate: function generate(construct) {
            assertTypeError(construct, 'function');

            var _ = this;

            defineObjectProperties(
                construct, {
                    configurable: false,
                    enumerable: false,
                    writable: false
                }, {
                    prototype: Object.create(_.prototype)
                }
            );

            defineObjectProperties(
                construct, {
                    configurable: false,
                    enumerable: false,
                    writable: false
                },
                Generation
            );

            defineObjectProperties(
                construct.prototype, {
                    configurable: false,
                    enumerable: false,
                    writable: false
                }, {
                    constructor: construct,
                    generator: construct,
                }
            );

            return construct;
        },

        /**
         * Defines shared properties for all objects created by this generator.
         * @param  {Object} descriptor Optional object descriptor that will be applied to all attaching properties.
         * @param  {Object} properties An object who's properties will be attached to this generator's prototype.
         * @return {Generator}         This generator.
         */
        definePrototype: function definePrototype(descriptor,
            properties) {
            defineObjectProperties(this.prototype,
                descriptor,
                properties);
            return this;
        }
    };

    function Generator() {}

    defineObjectProperties(
        Generator, {
            configurable: false,
            enumerable: false,
            writable: false
        }, {
            prototype: Generator.prototype
        }
    );

    defineObjectProperties(
        Generator.prototype, {
            configurable: false,
            enumerable: false,
            writable: false
        },
        Creation
    );

    defineObjectProperties(
        Generator, {
            configurable: false,
            enumerable: false,
            writable: false
        },
        Generation
    );

    defineObjectProperties(
        Generator, {
            configurable: false,
            enumerable: false,
            writable: false
        }, {
            /**
             * Returns true if 'generator' was generated by this Generator.
             * @param  {Generator} generator A Generator.
             * @return {Boolean}             true or false.
             */
            isGenerator: function isGenerator(generator) {
                return this.isGeneration(generator);
            },

            /**
             * Generates a new generator that inherits from `this` generator.
             * @param {Generator} extendFrom      Constructor to inherit from.
             * @param {Function} create           Create method that gets called when creating a new instance of new generator.
             * @return {Generator}                New Generator that inherits from 'ParentGenerator'.
             */
            toGenerator: function toGenerator(extendFrom, create) {
                console.warn(
                    'Generator.toGenerator is depreciated please use Generator.generateFrom'
                );
                return this.generateFrom(extendFrom, create);
            },

            /**
             * Generates a new generator that inherits from `this` generator.
             * @param {Constructor} extendFrom    Constructor to inherit from.
             * @param {Function} create           Create method that gets called when creating a new instance of new generator.
             * @return {Generator}                New Generator that inherits from 'ParentGenerator'.
             */
            generateFrom: function generateFrom(extendFrom, create) {
                assertTypeError(extendFrom, 'function');
                assertTypeError(create, 'function');

                defineObjectProperties(
                    create, {
                        configurable: false,
                        enumerable: false,
                        writable: false
                    }, {
                        prototype: Object.create(extendFrom.prototype),
                    }
                );

                defineObjectProperties(
                    create, {
                        configurable: false,
                        enumerable: false,
                        writable: false
                    },
                    Generation
                );

                defineObjectProperties(
                    create.prototype, {
                        configurable: false,
                        enumerable: false,
                        writable: false
                    }, {
                        constructor: create,
                        generator: create,
                    }
                );

                defineObjectProperties(
                    create.prototype, {
                        configurable: false,
                        enumerable: false,
                        writable: false
                    },
                    Creation
                );

                return create;
            }
        }
    );

    Object.freeze(Generator);
    Object.freeze(Generator.prototype);

    // Exports
    if (typeof define === 'function' && define.amd) {
        // AMD
        define(function () {
            return Generator;
        });
    } else if (typeof module === 'object' && typeof exports === 'object') {
        // Node/CommonJS
        module.exports = Generator;
    } else {
        // Browser global
        window.Generator = Generator;
    }

}());

},{}],63:[function(require,module,exports){
(function (global){
var topLevel = typeof global !== 'undefined' ? global :
    typeof window !== 'undefined' ? window : {}
var minDoc = require('min-document');

if (typeof document !== 'undefined') {
    module.exports = document;
} else {
    var doccy = topLevel['__GLOBAL_DOCUMENT_CACHE@4'];

    if (!doccy) {
        doccy = topLevel['__GLOBAL_DOCUMENT_CACHE@4'] = minDoc;
    }

    module.exports = doccy;
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"min-document":54}],64:[function(require,module,exports){
(function (global){
'use strict';

/*global window, global*/

var root = typeof window !== 'undefined' ?
    window : typeof global !== 'undefined' ?
    global : {};

module.exports = Individual;

function Individual(key, value) {
    if (key in root) {
        return root[key];
    }

    root[key] = value;

    return value;
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],65:[function(require,module,exports){
'use strict';

var Individual = require('./index.js');

module.exports = OneVersion;

function OneVersion(moduleName, version, defaultValue) {
    var key = '__INDIVIDUAL_ONE_VERSION_' + moduleName;
    var enforceKey = key + '_ENFORCE_SINGLETON';

    var versionValue = Individual(enforceKey, version);

    if (versionValue !== version) {
        throw new Error('Can only have one copy of ' +
            moduleName + '.\n' +
            'You already have version ' + versionValue +
            ' installed.\n' +
            'This means you cannot install version ' + version);
    }

    return Individual(key, defaultValue);
}

},{"./index.js":64}],66:[function(require,module,exports){
"use strict";

module.exports = function isObject(x) {
	return typeof x === "object" && x !== null;
};

},{}],67:[function(require,module,exports){
var createElement = require("./vdom/create-element.js")

module.exports = createElement

},{"./vdom/create-element.js":72}],68:[function(require,module,exports){
var diff = require("./vtree/diff.js")

module.exports = diff

},{"./vtree/diff.js":92}],69:[function(require,module,exports){
var h = require("./virtual-hyperscript/index.js")

module.exports = h

},{"./virtual-hyperscript/index.js":79}],70:[function(require,module,exports){
var patch = require("./vdom/patch.js")

module.exports = patch

},{"./vdom/patch.js":75}],71:[function(require,module,exports){
var isObject = require("is-object")
var isHook = require("../vnode/is-vhook.js")

module.exports = applyProperties

function applyProperties(node, props, previous) {
    for (var propName in props) {
        var propValue = props[propName]

        if (propValue === undefined) {
            removeProperty(node, propName, propValue, previous);
        } else if (isHook(propValue)) {
            removeProperty(node, propName, propValue, previous)
            if (propValue.hook) {
                propValue.hook(node,
                    propName,
                    previous ? previous[propName] : undefined)
            }
        } else {
            if (isObject(propValue)) {
                patchObject(node, props, previous, propName, propValue);
            } else {
                node[propName] = propValue
            }
        }
    }
}

function removeProperty(node, propName, propValue, previous) {
    if (previous) {
        var previousValue = previous[propName]

        if (!isHook(previousValue)) {
            if (propName === "attributes") {
                for (var attrName in previousValue) {
                    node.removeAttribute(attrName)
                }
            } else if (propName === "style") {
                for (var i in previousValue) {
                    node.style[i] = ""
                }
            } else if (typeof previousValue === "string") {
                node[propName] = ""
            } else {
                node[propName] = null
            }
        } else if (previousValue.unhook) {
            previousValue.unhook(node, propName, propValue)
        }
    }
}

function patchObject(node, props, previous, propName, propValue) {
    var previousValue = previous ? previous[propName] : undefined

    // Set attributes
    if (propName === "attributes") {
        for (var attrName in propValue) {
            var attrValue = propValue[attrName]

            if (attrValue === undefined) {
                node.removeAttribute(attrName)
            } else {
                node.setAttribute(attrName, attrValue)
            }
        }

        return
    }

    if(previousValue && isObject(previousValue) &&
        getPrototype(previousValue) !== getPrototype(propValue)) {
        node[propName] = propValue
        return
    }

    if (!isObject(node[propName])) {
        node[propName] = {}
    }

    var replacer = propName === "style" ? "" : undefined

    for (var k in propValue) {
        var value = propValue[k]
        node[propName][k] = (value === undefined) ? replacer : value
    }
}

function getPrototype(value) {
    if (Object.getPrototypeOf) {
        return Object.getPrototypeOf(value)
    } else if (value.__proto__) {
        return value.__proto__
    } else if (value.constructor) {
        return value.constructor.prototype
    }
}

},{"../vnode/is-vhook.js":83,"is-object":66}],72:[function(require,module,exports){
var document = require("global/document")

var applyProperties = require("./apply-properties")

var isVNode = require("../vnode/is-vnode.js")
var isVText = require("../vnode/is-vtext.js")
var isWidget = require("../vnode/is-widget.js")
var handleThunk = require("../vnode/handle-thunk.js")

module.exports = createElement

function createElement(vnode, opts) {
    var doc = opts ? opts.document || document : document
    var warn = opts ? opts.warn : null

    vnode = handleThunk(vnode).a

    if (isWidget(vnode)) {
        return vnode.init()
    } else if (isVText(vnode)) {
        return doc.createTextNode(vnode.text)
    } else if (!isVNode(vnode)) {
        if (warn) {
            warn("Item is not a valid virtual dom node", vnode)
        }
        return null
    }

    var node = (vnode.namespace === null) ?
        doc.createElement(vnode.tagName) :
        doc.createElementNS(vnode.namespace, vnode.tagName)

    var props = vnode.properties
    applyProperties(node, props)

    var children = vnode.children

    for (var i = 0; i < children.length; i++) {
        var childNode = createElement(children[i], opts)
        if (childNode) {
            node.appendChild(childNode)
        }
    }

    return node
}

},{"../vnode/handle-thunk.js":81,"../vnode/is-vnode.js":84,"../vnode/is-vtext.js":85,"../vnode/is-widget.js":86,"./apply-properties":71,"global/document":63}],73:[function(require,module,exports){
// Maps a virtual DOM tree onto a real DOM tree in an efficient manner.
// We don't want to read all of the DOM nodes in the tree so we use
// the in-order tree indexing to eliminate recursion down certain branches.
// We only recurse into a DOM node if we know that it contains a child of
// interest.

var noChild = {}

module.exports = domIndex

function domIndex(rootNode, tree, indices, nodes) {
    if (!indices || indices.length === 0) {
        return {}
    } else {
        indices.sort(ascending)
        return recurse(rootNode, tree, indices, nodes, 0)
    }
}

function recurse(rootNode, tree, indices, nodes, rootIndex) {
    nodes = nodes || {}


    if (rootNode) {
        if (indexInRange(indices, rootIndex, rootIndex)) {
            nodes[rootIndex] = rootNode
        }

        var vChildren = tree.children

        if (vChildren) {

            var childNodes = rootNode.childNodes

            for (var i = 0; i < tree.children.length; i++) {
                rootIndex += 1

                var vChild = vChildren[i] || noChild
                var nextIndex = rootIndex + (vChild.count || 0)

                // skip recursion down the tree if there are no nodes down here
                if (indexInRange(indices, rootIndex, nextIndex)) {
                    recurse(childNodes[i], vChild, indices, nodes, rootIndex)
                }

                rootIndex = nextIndex
            }
        }
    }

    return nodes
}

// Binary search for an index in the interval [left, right]
function indexInRange(indices, left, right) {
    if (indices.length === 0) {
        return false
    }

    var minIndex = 0
    var maxIndex = indices.length - 1
    var currentIndex
    var currentItem

    while (minIndex <= maxIndex) {
        currentIndex = ((maxIndex + minIndex) / 2) >> 0
        currentItem = indices[currentIndex]

        if (minIndex === maxIndex) {
            return currentItem >= left && currentItem <= right
        } else if (currentItem < left) {
            minIndex = currentIndex + 1
        } else  if (currentItem > right) {
            maxIndex = currentIndex - 1
        } else {
            return true
        }
    }

    return false;
}

function ascending(a, b) {
    return a > b ? 1 : -1
}

},{}],74:[function(require,module,exports){
var applyProperties = require("./apply-properties")

var isWidget = require("../vnode/is-widget.js")
var VPatch = require("../vnode/vpatch.js")

var updateWidget = require("./update-widget")

module.exports = applyPatch

function applyPatch(vpatch, domNode, renderOptions) {
    var type = vpatch.type
    var vNode = vpatch.vNode
    var patch = vpatch.patch

    switch (type) {
        case VPatch.REMOVE:
            return removeNode(domNode, vNode)
        case VPatch.INSERT:
            return insertNode(domNode, patch, renderOptions)
        case VPatch.VTEXT:
            return stringPatch(domNode, vNode, patch, renderOptions)
        case VPatch.WIDGET:
            return widgetPatch(domNode, vNode, patch, renderOptions)
        case VPatch.VNODE:
            return vNodePatch(domNode, vNode, patch, renderOptions)
        case VPatch.ORDER:
            reorderChildren(domNode, patch)
            return domNode
        case VPatch.PROPS:
            applyProperties(domNode, patch, vNode.properties)
            return domNode
        case VPatch.THUNK:
            return replaceRoot(domNode,
                renderOptions.patch(domNode, patch, renderOptions))
        default:
            return domNode
    }
}

function removeNode(domNode, vNode) {
    var parentNode = domNode.parentNode

    if (parentNode) {
        parentNode.removeChild(domNode)
    }

    destroyWidget(domNode, vNode);

    return null
}

function insertNode(parentNode, vNode, renderOptions) {
    var newNode = renderOptions.render(vNode, renderOptions)

    if (parentNode) {
        parentNode.appendChild(newNode)
    }

    return parentNode
}

function stringPatch(domNode, leftVNode, vText, renderOptions) {
    var newNode

    if (domNode.nodeType === 3) {
        domNode.replaceData(0, domNode.length, vText.text)
        newNode = domNode
    } else {
        var parentNode = domNode.parentNode
        newNode = renderOptions.render(vText, renderOptions)

        if (parentNode && newNode !== domNode) {
            parentNode.replaceChild(newNode, domNode)
        }
    }

    return newNode
}

function widgetPatch(domNode, leftVNode, widget, renderOptions) {
    var updating = updateWidget(leftVNode, widget)
    var newNode

    if (updating) {
        newNode = widget.update(leftVNode, domNode) || domNode
    } else {
        newNode = renderOptions.render(widget, renderOptions)
    }

    var parentNode = domNode.parentNode

    if (parentNode && newNode !== domNode) {
        parentNode.replaceChild(newNode, domNode)
    }

    if (!updating) {
        destroyWidget(domNode, leftVNode)
    }

    return newNode
}

function vNodePatch(domNode, leftVNode, vNode, renderOptions) {
    var parentNode = domNode.parentNode
    var newNode = renderOptions.render(vNode, renderOptions)

    if (parentNode && newNode !== domNode) {
        parentNode.replaceChild(newNode, domNode)
    }

    return newNode
}

function destroyWidget(domNode, w) {
    if (typeof w.destroy === "function" && isWidget(w)) {
        w.destroy(domNode)
    }
}

function reorderChildren(domNode, moves) {
    var childNodes = domNode.childNodes
    var keyMap = {}
    var node
    var remove
    var insert

    for (var i = 0; i < moves.removes.length; i++) {
        remove = moves.removes[i]
        node = childNodes[remove.from]
        if (remove.key) {
            keyMap[remove.key] = node
        }
        domNode.removeChild(node)
    }

    var length = childNodes.length
    for (var j = 0; j < moves.inserts.length; j++) {
        insert = moves.inserts[j]
        node = keyMap[insert.key]
        // this is the weirdest bug i've ever seen in webkit
        domNode.insertBefore(node, insert.to >= length++ ? null : childNodes[insert.to])
    }
}

function replaceRoot(oldRoot, newRoot) {
    if (oldRoot && newRoot && oldRoot !== newRoot && oldRoot.parentNode) {
        oldRoot.parentNode.replaceChild(newRoot, oldRoot)
    }

    return newRoot;
}

},{"../vnode/is-widget.js":86,"../vnode/vpatch.js":89,"./apply-properties":71,"./update-widget":76}],75:[function(require,module,exports){
var document = require("global/document")
var isArray = require("x-is-array")

var render = require("./create-element")
var domIndex = require("./dom-index")
var patchOp = require("./patch-op")
module.exports = patch

function patch(rootNode, patches, renderOptions) {
    renderOptions = renderOptions || {}
    renderOptions.patch = renderOptions.patch && renderOptions.patch !== patch
        ? renderOptions.patch
        : patchRecursive
    renderOptions.render = renderOptions.render || render

    return renderOptions.patch(rootNode, patches, renderOptions)
}

function patchRecursive(rootNode, patches, renderOptions) {
    var indices = patchIndices(patches)

    if (indices.length === 0) {
        return rootNode
    }

    var index = domIndex(rootNode, patches.a, indices)
    var ownerDocument = rootNode.ownerDocument

    if (!renderOptions.document && ownerDocument !== document) {
        renderOptions.document = ownerDocument
    }

    for (var i = 0; i < indices.length; i++) {
        var nodeIndex = indices[i]
        rootNode = applyPatch(rootNode,
            index[nodeIndex],
            patches[nodeIndex],
            renderOptions)
    }

    return rootNode
}

function applyPatch(rootNode, domNode, patchList, renderOptions) {
    if (!domNode) {
        return rootNode
    }

    var newNode

    if (isArray(patchList)) {
        for (var i = 0; i < patchList.length; i++) {
            newNode = patchOp(patchList[i], domNode, renderOptions)

            if (domNode === rootNode) {
                rootNode = newNode
            }
        }
    } else {
        newNode = patchOp(patchList, domNode, renderOptions)

        if (domNode === rootNode) {
            rootNode = newNode
        }
    }

    return rootNode
}

function patchIndices(patches) {
    var indices = []

    for (var key in patches) {
        if (key !== "a") {
            indices.push(Number(key))
        }
    }

    return indices
}

},{"./create-element":72,"./dom-index":73,"./patch-op":74,"global/document":63,"x-is-array":93}],76:[function(require,module,exports){
var isWidget = require("../vnode/is-widget.js")

module.exports = updateWidget

function updateWidget(a, b) {
    if (isWidget(a) && isWidget(b)) {
        if ("name" in a && "name" in b) {
            return a.id === b.id
        } else {
            return a.init === b.init
        }
    }

    return false
}

},{"../vnode/is-widget.js":86}],77:[function(require,module,exports){
'use strict';

var EvStore = require('ev-store');

module.exports = EvHook;

function EvHook(value) {
    if (!(this instanceof EvHook)) {
        return new EvHook(value);
    }

    this.value = value;
}

EvHook.prototype.hook = function (node, propertyName) {
    var es = EvStore(node);
    var propName = propertyName.substr(3);

    es[propName] = this.value;
};

EvHook.prototype.unhook = function(node, propertyName) {
    var es = EvStore(node);
    var propName = propertyName.substr(3);

    es[propName] = undefined;
};

},{"ev-store":61}],78:[function(require,module,exports){
'use strict';

module.exports = SoftSetHook;

function SoftSetHook(value) {
    if (!(this instanceof SoftSetHook)) {
        return new SoftSetHook(value);
    }

    this.value = value;
}

SoftSetHook.prototype.hook = function (node, propertyName) {
    if (node[propertyName] !== this.value) {
        node[propertyName] = this.value;
    }
};

},{}],79:[function(require,module,exports){
'use strict';

var isArray = require('x-is-array');

var VNode = require('../vnode/vnode.js');
var VText = require('../vnode/vtext.js');
var isVNode = require('../vnode/is-vnode');
var isVText = require('../vnode/is-vtext');
var isWidget = require('../vnode/is-widget');
var isHook = require('../vnode/is-vhook');
var isVThunk = require('../vnode/is-thunk');

var parseTag = require('./parse-tag.js');
var softSetHook = require('./hooks/soft-set-hook.js');
var evHook = require('./hooks/ev-hook.js');

module.exports = h;

function h(tagName, properties, children) {
    var childNodes = [];
    var tag, props, key, namespace;

    if (!children && isChildren(properties)) {
        children = properties;
        props = {};
    }

    props = props || properties || {};
    tag = parseTag(tagName, props);

    // support keys
    if (props.hasOwnProperty('key')) {
        key = props.key;
        props.key = undefined;
    }

    // support namespace
    if (props.hasOwnProperty('namespace')) {
        namespace = props.namespace;
        props.namespace = undefined;
    }

    // fix cursor bug
    if (tag === 'INPUT' &&
        !namespace &&
        props.hasOwnProperty('value') &&
        props.value !== undefined &&
        !isHook(props.value)
    ) {
        props.value = softSetHook(props.value);
    }

    transformProperties(props);

    if (children !== undefined && children !== null) {
        addChild(children, childNodes, tag, props);
    }


    return new VNode(tag, props, childNodes, key, namespace);
}

function addChild(c, childNodes, tag, props) {
    if (typeof c === 'string') {
        childNodes.push(new VText(c));
    } else if (typeof c === 'number') {
        childNodes.push(new VText(String(c)));
    } else if (isChild(c)) {
        childNodes.push(c);
    } else if (isArray(c)) {
        for (var i = 0; i < c.length; i++) {
            addChild(c[i], childNodes, tag, props);
        }
    } else if (c === null || c === undefined) {
        return;
    } else {
        throw UnexpectedVirtualElement({
            foreignObject: c,
            parentVnode: {
                tagName: tag,
                properties: props
            }
        });
    }
}

function transformProperties(props) {
    for (var propName in props) {
        if (props.hasOwnProperty(propName)) {
            var value = props[propName];

            if (isHook(value)) {
                continue;
            }

            if (propName.substr(0, 3) === 'ev-') {
                // add ev-foo support
                props[propName] = evHook(value);
            }
        }
    }
}

function isChild(x) {
    return isVNode(x) || isVText(x) || isWidget(x) || isVThunk(x);
}

function isChildren(x) {
    return typeof x === 'string' || isArray(x) || isChild(x);
}

function UnexpectedVirtualElement(data) {
    var err = new Error();

    err.type = 'virtual-hyperscript.unexpected.virtual-element';
    err.message = 'Unexpected virtual child passed to h().\n' +
        'Expected a VNode / Vthunk / VWidget / string but:\n' +
        'got:\n' +
        errorString(data.foreignObject) +
        '.\n' +
        'The parent vnode is:\n' +
        errorString(data.parentVnode)
        '\n' +
        'Suggested fix: change your `h(..., [ ... ])` callsite.';
    err.foreignObject = data.foreignObject;
    err.parentVnode = data.parentVnode;

    return err;
}

function errorString(obj) {
    try {
        return JSON.stringify(obj, null, '    ');
    } catch (e) {
        return String(obj);
    }
}

},{"../vnode/is-thunk":82,"../vnode/is-vhook":83,"../vnode/is-vnode":84,"../vnode/is-vtext":85,"../vnode/is-widget":86,"../vnode/vnode.js":88,"../vnode/vtext.js":90,"./hooks/ev-hook.js":77,"./hooks/soft-set-hook.js":78,"./parse-tag.js":80,"x-is-array":93}],80:[function(require,module,exports){
'use strict';

var split = require('browser-split');

var classIdSplit = /([\.#]?[a-zA-Z0-9\u007F-\uFFFF_:-]+)/;
var notClassId = /^\.|#/;

module.exports = parseTag;

function parseTag(tag, props) {
    if (!tag) {
        return 'DIV';
    }

    var noId = !(props.hasOwnProperty('id'));

    var tagParts = split(tag, classIdSplit);
    var tagName = null;

    if (notClassId.test(tagParts[1])) {
        tagName = 'DIV';
    }

    var classes, part, type, i;

    for (i = 0; i < tagParts.length; i++) {
        part = tagParts[i];

        if (!part) {
            continue;
        }

        type = part.charAt(0);

        if (!tagName) {
            tagName = part;
        } else if (type === '.') {
            classes = classes || [];
            classes.push(part.substring(1, part.length));
        } else if (type === '#' && noId) {
            props.id = part.substring(1, part.length);
        }
    }

    if (classes) {
        if (props.className) {
            classes.push(props.className);
        }

        props.className = classes.join(' ');
    }

    return props.namespace ? tagName : tagName.toUpperCase();
}

},{"browser-split":53}],81:[function(require,module,exports){
var isVNode = require("./is-vnode")
var isVText = require("./is-vtext")
var isWidget = require("./is-widget")
var isThunk = require("./is-thunk")

module.exports = handleThunk

function handleThunk(a, b) {
    var renderedA = a
    var renderedB = b

    if (isThunk(b)) {
        renderedB = renderThunk(b, a)
    }

    if (isThunk(a)) {
        renderedA = renderThunk(a, null)
    }

    return {
        a: renderedA,
        b: renderedB
    }
}

function renderThunk(thunk, previous) {
    var renderedThunk = thunk.vnode

    if (!renderedThunk) {
        renderedThunk = thunk.vnode = thunk.render(previous)
    }

    if (!(isVNode(renderedThunk) ||
            isVText(renderedThunk) ||
            isWidget(renderedThunk))) {
        throw new Error("thunk did not return a valid node");
    }

    return renderedThunk
}

},{"./is-thunk":82,"./is-vnode":84,"./is-vtext":85,"./is-widget":86}],82:[function(require,module,exports){
module.exports = isThunk

function isThunk(t) {
    return t && t.type === "Thunk"
}

},{}],83:[function(require,module,exports){
module.exports = isHook

function isHook(hook) {
    return hook &&
      (typeof hook.hook === "function" && !hook.hasOwnProperty("hook") ||
       typeof hook.unhook === "function" && !hook.hasOwnProperty("unhook"))
}

},{}],84:[function(require,module,exports){
var version = require("./version")

module.exports = isVirtualNode

function isVirtualNode(x) {
    return x && x.type === "VirtualNode" && x.version === version
}

},{"./version":87}],85:[function(require,module,exports){
var version = require("./version")

module.exports = isVirtualText

function isVirtualText(x) {
    return x && x.type === "VirtualText" && x.version === version
}

},{"./version":87}],86:[function(require,module,exports){
module.exports = isWidget

function isWidget(w) {
    return w && w.type === "Widget"
}

},{}],87:[function(require,module,exports){
module.exports = "2"

},{}],88:[function(require,module,exports){
var version = require("./version")
var isVNode = require("./is-vnode")
var isWidget = require("./is-widget")
var isThunk = require("./is-thunk")
var isVHook = require("./is-vhook")

module.exports = VirtualNode

var noProperties = {}
var noChildren = []

function VirtualNode(tagName, properties, children, key, namespace) {
    this.tagName = tagName
    this.properties = properties || noProperties
    this.children = children || noChildren
    this.key = key != null ? String(key) : undefined
    this.namespace = (typeof namespace === "string") ? namespace : null

    var count = (children && children.length) || 0
    var descendants = 0
    var hasWidgets = false
    var hasThunks = false
    var descendantHooks = false
    var hooks

    for (var propName in properties) {
        if (properties.hasOwnProperty(propName)) {
            var property = properties[propName]
            if (isVHook(property) && property.unhook) {
                if (!hooks) {
                    hooks = {}
                }

                hooks[propName] = property
            }
        }
    }

    for (var i = 0; i < count; i++) {
        var child = children[i]
        if (isVNode(child)) {
            descendants += child.count || 0

            if (!hasWidgets && child.hasWidgets) {
                hasWidgets = true
            }

            if (!hasThunks && child.hasThunks) {
                hasThunks = true
            }

            if (!descendantHooks && (child.hooks || child.descendantHooks)) {
                descendantHooks = true
            }
        } else if (!hasWidgets && isWidget(child)) {
            if (typeof child.destroy === "function") {
                hasWidgets = true
            }
        } else if (!hasThunks && isThunk(child)) {
            hasThunks = true;
        }
    }

    this.count = count + descendants
    this.hasWidgets = hasWidgets
    this.hasThunks = hasThunks
    this.hooks = hooks
    this.descendantHooks = descendantHooks
}

VirtualNode.prototype.version = version
VirtualNode.prototype.type = "VirtualNode"

},{"./is-thunk":82,"./is-vhook":83,"./is-vnode":84,"./is-widget":86,"./version":87}],89:[function(require,module,exports){
var version = require("./version")

VirtualPatch.NONE = 0
VirtualPatch.VTEXT = 1
VirtualPatch.VNODE = 2
VirtualPatch.WIDGET = 3
VirtualPatch.PROPS = 4
VirtualPatch.ORDER = 5
VirtualPatch.INSERT = 6
VirtualPatch.REMOVE = 7
VirtualPatch.THUNK = 8

module.exports = VirtualPatch

function VirtualPatch(type, vNode, patch) {
    this.type = Number(type)
    this.vNode = vNode
    this.patch = patch
}

VirtualPatch.prototype.version = version
VirtualPatch.prototype.type = "VirtualPatch"

},{"./version":87}],90:[function(require,module,exports){
var version = require("./version")

module.exports = VirtualText

function VirtualText(text) {
    this.text = String(text)
}

VirtualText.prototype.version = version
VirtualText.prototype.type = "VirtualText"

},{"./version":87}],91:[function(require,module,exports){
var isObject = require("is-object")
var isHook = require("../vnode/is-vhook")

module.exports = diffProps

function diffProps(a, b) {
    var diff

    for (var aKey in a) {
        if (!(aKey in b)) {
            diff = diff || {}
            diff[aKey] = undefined
        }

        var aValue = a[aKey]
        var bValue = b[aKey]

        if (aValue === bValue) {
            continue
        } else if (isObject(aValue) && isObject(bValue)) {
            if (getPrototype(bValue) !== getPrototype(aValue)) {
                diff = diff || {}
                diff[aKey] = bValue
            } else if (isHook(bValue)) {
                 diff = diff || {}
                 diff[aKey] = bValue
            } else {
                var objectDiff = diffProps(aValue, bValue)
                if (objectDiff) {
                    diff = diff || {}
                    diff[aKey] = objectDiff
                }
            }
        } else {
            diff = diff || {}
            diff[aKey] = bValue
        }
    }

    for (var bKey in b) {
        if (!(bKey in a)) {
            diff = diff || {}
            diff[bKey] = b[bKey]
        }
    }

    return diff
}

function getPrototype(value) {
  if (Object.getPrototypeOf) {
    return Object.getPrototypeOf(value)
  } else if (value.__proto__) {
    return value.__proto__
  } else if (value.constructor) {
    return value.constructor.prototype
  }
}

},{"../vnode/is-vhook":83,"is-object":66}],92:[function(require,module,exports){
var isArray = require("x-is-array")

var VPatch = require("../vnode/vpatch")
var isVNode = require("../vnode/is-vnode")
var isVText = require("../vnode/is-vtext")
var isWidget = require("../vnode/is-widget")
var isThunk = require("../vnode/is-thunk")
var handleThunk = require("../vnode/handle-thunk")

var diffProps = require("./diff-props")

module.exports = diff

function diff(a, b) {
    var patch = { a: a }
    walk(a, b, patch, 0)
    return patch
}

function walk(a, b, patch, index) {
    if (a === b) {
        return
    }

    var apply = patch[index]
    var applyClear = false

    if (isThunk(a) || isThunk(b)) {
        thunks(a, b, patch, index)
    } else if (b == null) {

        // If a is a widget we will add a remove patch for it
        // Otherwise any child widgets/hooks must be destroyed.
        // This prevents adding two remove patches for a widget.
        if (!isWidget(a)) {
            clearState(a, patch, index)
            apply = patch[index]
        }

        apply = appendPatch(apply, new VPatch(VPatch.REMOVE, a, b))
    } else if (isVNode(b)) {
        if (isVNode(a)) {
            if (a.tagName === b.tagName &&
                a.namespace === b.namespace &&
                a.key === b.key) {
                var propsPatch = diffProps(a.properties, b.properties)
                if (propsPatch) {
                    apply = appendPatch(apply,
                        new VPatch(VPatch.PROPS, a, propsPatch))
                }
                apply = diffChildren(a, b, patch, apply, index)
            } else {
                apply = appendPatch(apply, new VPatch(VPatch.VNODE, a, b))
                applyClear = true
            }
        } else {
            apply = appendPatch(apply, new VPatch(VPatch.VNODE, a, b))
            applyClear = true
        }
    } else if (isVText(b)) {
        if (!isVText(a)) {
            apply = appendPatch(apply, new VPatch(VPatch.VTEXT, a, b))
            applyClear = true
        } else if (a.text !== b.text) {
            apply = appendPatch(apply, new VPatch(VPatch.VTEXT, a, b))
        }
    } else if (isWidget(b)) {
        if (!isWidget(a)) {
            applyClear = true
        }

        apply = appendPatch(apply, new VPatch(VPatch.WIDGET, a, b))
    }

    if (apply) {
        patch[index] = apply
    }

    if (applyClear) {
        clearState(a, patch, index)
    }
}

function diffChildren(a, b, patch, apply, index) {
    var aChildren = a.children
    var orderedSet = reorder(aChildren, b.children)
    var bChildren = orderedSet.children

    var aLen = aChildren.length
    var bLen = bChildren.length
    var len = aLen > bLen ? aLen : bLen

    for (var i = 0; i < len; i++) {
        var leftNode = aChildren[i]
        var rightNode = bChildren[i]
        index += 1

        if (!leftNode) {
            if (rightNode) {
                // Excess nodes in b need to be added
                apply = appendPatch(apply,
                    new VPatch(VPatch.INSERT, null, rightNode))
            }
        } else {
            walk(leftNode, rightNode, patch, index)
        }

        if (isVNode(leftNode) && leftNode.count) {
            index += leftNode.count
        }
    }

    if (orderedSet.moves) {
        // Reorder nodes last
        apply = appendPatch(apply, new VPatch(
            VPatch.ORDER,
            a,
            orderedSet.moves
        ))
    }

    return apply
}

function clearState(vNode, patch, index) {
    // TODO: Make this a single walk, not two
    unhook(vNode, patch, index)
    destroyWidgets(vNode, patch, index)
}

// Patch records for all destroyed widgets must be added because we need
// a DOM node reference for the destroy function
function destroyWidgets(vNode, patch, index) {
    if (isWidget(vNode)) {
        if (typeof vNode.destroy === "function") {
            patch[index] = appendPatch(
                patch[index],
                new VPatch(VPatch.REMOVE, vNode, null)
            )
        }
    } else if (isVNode(vNode) && (vNode.hasWidgets || vNode.hasThunks)) {
        var children = vNode.children
        var len = children.length
        for (var i = 0; i < len; i++) {
            var child = children[i]
            index += 1

            destroyWidgets(child, patch, index)

            if (isVNode(child) && child.count) {
                index += child.count
            }
        }
    } else if (isThunk(vNode)) {
        thunks(vNode, null, patch, index)
    }
}

// Create a sub-patch for thunks
function thunks(a, b, patch, index) {
    var nodes = handleThunk(a, b)
    var thunkPatch = diff(nodes.a, nodes.b)
    if (hasPatches(thunkPatch)) {
        patch[index] = new VPatch(VPatch.THUNK, null, thunkPatch)
    }
}

function hasPatches(patch) {
    for (var index in patch) {
        if (index !== "a") {
            return true
        }
    }

    return false
}

// Execute hooks when two nodes are identical
function unhook(vNode, patch, index) {
    if (isVNode(vNode)) {
        if (vNode.hooks) {
            patch[index] = appendPatch(
                patch[index],
                new VPatch(
                    VPatch.PROPS,
                    vNode,
                    undefinedKeys(vNode.hooks)
                )
            )
        }

        if (vNode.descendantHooks || vNode.hasThunks) {
            var children = vNode.children
            var len = children.length
            for (var i = 0; i < len; i++) {
                var child = children[i]
                index += 1

                unhook(child, patch, index)

                if (isVNode(child) && child.count) {
                    index += child.count
                }
            }
        }
    } else if (isThunk(vNode)) {
        thunks(vNode, null, patch, index)
    }
}

function undefinedKeys(obj) {
    var result = {}

    for (var key in obj) {
        result[key] = undefined
    }

    return result
}

// List diff, naive left to right reordering
function reorder(aChildren, bChildren) {
    // O(M) time, O(M) memory
    var bChildIndex = keyIndex(bChildren)
    var bKeys = bChildIndex.keys
    var bFree = bChildIndex.free

    if (bFree.length === bChildren.length) {
        return {
            children: bChildren,
            moves: null
        }
    }

    // O(N) time, O(N) memory
    var aChildIndex = keyIndex(aChildren)
    var aKeys = aChildIndex.keys
    var aFree = aChildIndex.free

    if (aFree.length === aChildren.length) {
        return {
            children: bChildren,
            moves: null
        }
    }

    // O(MAX(N, M)) memory
    var newChildren = []

    var freeIndex = 0
    var freeCount = bFree.length
    var deletedItems = 0

    // Iterate through a and match a node in b
    // O(N) time,
    for (var i = 0 ; i < aChildren.length; i++) {
        var aItem = aChildren[i]
        var itemIndex

        if (aItem.key) {
            if (bKeys.hasOwnProperty(aItem.key)) {
                // Match up the old keys
                itemIndex = bKeys[aItem.key]
                newChildren.push(bChildren[itemIndex])

            } else {
                // Remove old keyed items
                itemIndex = i - deletedItems++
                newChildren.push(null)
            }
        } else {
            // Match the item in a with the next free item in b
            if (freeIndex < freeCount) {
                itemIndex = bFree[freeIndex++]
                newChildren.push(bChildren[itemIndex])
            } else {
                // There are no free items in b to match with
                // the free items in a, so the extra free nodes
                // are deleted.
                itemIndex = i - deletedItems++
                newChildren.push(null)
            }
        }
    }

    var lastFreeIndex = freeIndex >= bFree.length ?
        bChildren.length :
        bFree[freeIndex]

    // Iterate through b and append any new keys
    // O(M) time
    for (var j = 0; j < bChildren.length; j++) {
        var newItem = bChildren[j]

        if (newItem.key) {
            if (!aKeys.hasOwnProperty(newItem.key)) {
                // Add any new keyed items
                // We are adding new items to the end and then sorting them
                // in place. In future we should insert new items in place.
                newChildren.push(newItem)
            }
        } else if (j >= lastFreeIndex) {
            // Add any leftover non-keyed items
            newChildren.push(newItem)
        }
    }

    var simulate = newChildren.slice()
    var simulateIndex = 0
    var removes = []
    var inserts = []
    var simulateItem

    for (var k = 0; k < bChildren.length;) {
        var wantedItem = bChildren[k]
        simulateItem = simulate[simulateIndex]

        // remove items
        while (simulateItem === null && simulate.length) {
            removes.push(remove(simulate, simulateIndex, null))
            simulateItem = simulate[simulateIndex]
        }

        if (!simulateItem || simulateItem.key !== wantedItem.key) {
            // if we need a key in this position...
            if (wantedItem.key) {
                if (simulateItem && simulateItem.key) {
                    // if an insert doesn't put this key in place, it needs to move
                    if (bKeys[simulateItem.key] !== k + 1) {
                        removes.push(remove(simulate, simulateIndex, simulateItem.key))
                        simulateItem = simulate[simulateIndex]
                        // if the remove didn't put the wanted item in place, we need to insert it
                        if (!simulateItem || simulateItem.key !== wantedItem.key) {
                            inserts.push({key: wantedItem.key, to: k})
                        }
                        // items are matching, so skip ahead
                        else {
                            simulateIndex++
                        }
                    }
                    else {
                        inserts.push({key: wantedItem.key, to: k})
                    }
                }
                else {
                    inserts.push({key: wantedItem.key, to: k})
                }
                k++
            }
            // a key in simulate has no matching wanted key, remove it
            else if (simulateItem && simulateItem.key) {
                removes.push(remove(simulate, simulateIndex, simulateItem.key))
            }
        }
        else {
            simulateIndex++
            k++
        }
    }

    // remove all the remaining nodes from simulate
    while(simulateIndex < simulate.length) {
        simulateItem = simulate[simulateIndex]
        removes.push(remove(simulate, simulateIndex, simulateItem && simulateItem.key))
    }

    // If the only moves we have are deletes then we can just
    // let the delete patch remove these items.
    if (removes.length === deletedItems && !inserts.length) {
        return {
            children: newChildren,
            moves: null
        }
    }

    return {
        children: newChildren,
        moves: {
            removes: removes,
            inserts: inserts
        }
    }
}

function remove(arr, index, key) {
    arr.splice(index, 1)

    return {
        from: index,
        key: key
    }
}

function keyIndex(children) {
    var keys = {}
    var free = []
    var length = children.length

    for (var i = 0; i < length; i++) {
        var child = children[i]

        if (child.key) {
            keys[child.key] = i
        } else {
            free.push(i)
        }
    }

    return {
        keys: keys,     // A hash of key name to index
        free: free      // An array of unkeyed item indices
    }
}

function appendPatch(apply, patch) {
    if (apply) {
        if (isArray(apply)) {
            apply.push(patch)
        } else {
            apply = [apply, patch]
        }

        return apply
    } else {
        return patch
    }
}

},{"../vnode/handle-thunk":81,"../vnode/is-thunk":82,"../vnode/is-vnode":84,"../vnode/is-vtext":85,"../vnode/is-widget":86,"../vnode/vpatch":89,"./diff-props":91,"x-is-array":93}],93:[function(require,module,exports){
var nativeIsArray = Array.isArray
var toString = Object.prototype.toString

module.exports = nativeIsArray || isArray

function isArray(obj) {
    return toString.call(obj) === "[object Array]"
}

},{}],94:[function(require,module,exports){
module.exports={
  "name": "bars",
  "version": "0.8.1",
  "description": "Bars is a lightweight high performance HTML aware templating engine.",
  "main": "index.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "repository": {
    "type": "git",
    "url": "git+https://github.com/Mike96Angelo/Bars.git"
  },
  "keywords": [
    "bars",
    "render",
    "renderer",
    "rendering",
    "template",
    "templating",
    "html"
  ],
  "author": "Michaelangelo Jong",
  "license": "MIT",
  "bugs": {
    "url": "https://github.com/Mike96Angelo/Bars/issues"
  },
  "homepage": "https://github.com/Mike96Angelo/Bars#readme",
  "dependencies": {
    "compileit": "^1.0.1",
    "generate-js": "^3.1.2",
    "jquery": "^3.1.1",
    "source-map": "^0.5.6",
    "virtual-dom": "^2.1.1"
  },
  "devDependencies": {
    "browserify": "^13.1.1",
    "colors": "^1.1.2",
    "gulp": "^3.9.1",
    "gulp-minify": "0.0.14",
    "stringify": "^5.1.0",
    "vinyl-buffer": "^1.0.0",
    "vinyl-source-stream": "^1.1.0"
  }
}

},{}]},{},[1])(1)
});