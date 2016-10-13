(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.Bars = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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
    build: function build(parsedTemplate) {
        var _ = this,
            program = parsedTemplate;

        if (Array.isArray(parsedTemplate)) {
            program = new Token.tokens.program();

            program.fromArray(parsedTemplate);
        }

        return new Renderer(_, program.fragment);
    },

    registerBlock: function registerBlock(name, block) {
        var _ = this;

        _.blocks[name] = block;
    },

    registerPartial: function registerPartial(name, template) {
        var _ = this;

        _.partials[name] = _.compile(template);
    },

    registerTransform: function registerTransform(name, func) {
        var _ = this;

        _.transforms[name] = func;
    },
});

module.exports = Bars;

},{"../package":56,"./blocks":3,"./compiler/tokens":28,"./renderer":43,"./transforms":48,"generate-js":55}],2:[function(require,module,exports){
var Bars = require('./bars-runtime'),
    compile = require('./compiler');


Bars.definePrototype({
    compile: function compile(template, filename, mode, flags) {
        var _ = this;
        return _.build(_.parse(template, filename, mode, flags));
    },

    parse: function parse(template, filename, mode, flags) {
        return compile(template, filename, mode, flags);
    }
});

module.exports = Bars;

},{"./bars-runtime":1,"./compiler":5}],3:[function(require,module,exports){
var Generator = require('generate-js');

var Blocks = Generator.generate(function Blocks() {});

Blocks.definePrototype({
    if: function ifBlock(con) {
        return con;
    },

    with: function withBlock(data) {
        var _ = this;

        if (data && typeof data === 'object') {
            if (!_.nodes[0]) {
                var frag = _.createFragment();

                var newPath = _.path.slice();

                frag.context.path = newPath;
            }
            _.nodes[0].context.data = data;

            return true;
        }

        return false;
    },

    each: function eachBlock(data) {
        var _ = this,
            i;

        if (data && typeof data === 'object') {
            var keys = Object.keys(data);

            if (keys.length) {
                // TODO: This should be smarter.

                // remove extra nodes
                for (i = _.nodes.length - 1; i >= keys.length; i--) {
                    _.nodes[i].remove();
                }

                // add needed nodes
                for (i = _.nodes.length; i < keys.length; i++) {
                    _.createFragment(keys[i]);
                }

                // update node paths
                for (i = 0; i < keys.length; i++) {
                    var newPath = _.path.slice();

                    newPath.push(keys[i]);

                    _.nodes[i].context.path = newPath;
                    _.nodes[i].context.data = data[keys[i]];
                }

                return true;
            }
        }

        return false;
    }
});

module.exports = Blocks;

},{"generate-js":55}],4:[function(require,module,exports){
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
        parsers.parseExpressionTransform,
        parsers.parseExpressionValue,
        parsers.parseExpressionLiteral,
        parsers.parseExpressionOpperator,
        parsers.parseWhitspace
    ],
    'LOGIC-ARGS': [
        parsers.parseExpressionTransformEnd,
        parsers.parseExpressionTransform,
        parsers.parseExpressionValue,
        parsers.parseExpressionLiteral,
        parsers.parseExpressionOpperator,
        parsers.parseWhitspace
    ]
};

var compiler = new compileit.Compiler(parseModes, {
    modeFormater: function (a) {
        return a.green;
    }, //
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

},{"./parsers":22,"./tokens":28,"compileit":49}],5:[function(require,module,exports){
module.exports = require('./compiler');

},{"./compiler":4}],6:[function(require,module,exports){
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

    block.expression = args[0];

    if (args.length > 1) {
        throw code.makeError(
            args[1].range[0], args[1].range[1],
            'Unexpected Token: ' +
            JSON.stringify(args[1].source(code)) + '.'
        );
    }

    args = null;

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

    if (!block.expression) {
        throw code.makeError(
            code.index - 2, code.index - 1,
            'Missing <expression>.'
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

},{"../tokens":28,"../utils":40}],7:[function(require,module,exports){
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

},{}],8:[function(require,module,exports){
var InsertToken = require('../tokens')
    .tokens.insert;

function parseBarsInsert(mode, code, tokens, flags, scope, parseMode) {
    var index = code.index + 2,
        length = code.length,
        insert = new InsertToken(code),
        args = [];

    scope.push(insert);
    code.index = index;

    parseMode('LOGIC', args, flags);

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

},{"../tokens":28}],9:[function(require,module,exports){
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
            Token.tokens.partial.isCreation(scope.token)
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

},{"../tokens":28}],10:[function(require,module,exports){
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

},{}],11:[function(require,module,exports){
var PartialToken = require('../tokens')
    .tokens.partial,
    utils = require('../utils');

function parseBarsPartial(mode, code, tokens, flags, scope, parseMode) {
    var index = code.index + 2,
        length = code.length,
        partial;

    if ( /* > */
        code.codePointAt(index) === 0x003e
    ) {
        partial = new PartialToken(code);

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
                partial.name += code.charAt(index);
            } else {
                break;
            }
        }

        code.index = index;


        var args = [];

        scope.push(partial);
        parseMode('LOGIC', args, flags);

        if (args.length > 1) {
            throw code.makeError(
                args[1].range[0], args[1].range[1],
                'Unexpected Token: ' +
                JSON.stringify(args[1].source(code)) + '.'
            );
        }

        partial.expression = args[0] || null;

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

        // if (!partial.argument) {
        //     code.index -= 2;
        //     throw code.makeError('Missing <arg>.');
        // }

        parseMode.close();
        return partial;
    }

    return null;
}

module.exports = parseBarsPartial;

},{"../tokens":28,"../utils":40}],12:[function(require,module,exports){
var Token = require('../tokens'),
    LiteralToken = Token.tokens.literal,
    OpperatorToken = Token.tokens.opperator;

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

        if (
            OpperatorToken.isCreation(scope.token)
        ) {
            scope.close();
            parseMode.close();
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

        if (
            OpperatorToken.isCreation(scope.token)
        ) {
            scope.close();
            parseMode.close();
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

    if (
        OpperatorToken.isCreation(scope.token)
    ) {
        scope.close();
        parseMode.close();
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

    if (
        OpperatorToken.isCreation(scope.token)
    ) {
        scope.close();
        parseMode.close();
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

},{"../tokens":28}],13:[function(require,module,exports){
var Token = require('../tokens'),
    ValueToken = Token.tokens.value,
    LiteralToken = Token.tokens.literal,
    OpperatorToken = Token.tokens.opperator,
    TransformToken = Token.tokens.transform,
    utils = require('../utils');

function parseExpressionOpperator(mode, code, tokens, flags, scope, parseMode) {
    var index = code.index,
        length = code.length,
        originalIndex = index,
        oldIndex,
        ch = code.codePointAt(index),
        ch2, ch3,
        expression,
        binary_fail;

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
        expression = new OpperatorToken(code);
        expression.opperator = code.slice(index, index + 3);
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
        expression = new OpperatorToken(code);
        expression.opperator = code.slice(index, index + 2);
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
        expression = new OpperatorToken(code);
        expression.opperator = code.charAt(index);
        expression.binary = true;
    } else if ( /* handle UNARY-EXPRESSION */
        ch === 0x0021 /* ! */
    ) {
        code.index = index;
        expression = new OpperatorToken(code);
        expression.opperator = code.charAt(index);
        expression.unary = true;
        index++;
    }

    if (!expression || !expression.opperator) {
        if (binary_fail) {
            return null;
        }
        code.index = index;
        return true;
    }

    if (expression.binary) {
        if (binary_fail) {
            throw code.makeError(
                originalIndex, originalIndex + expression.opperator.length,
                'Unexpected Token: ' +
                JSON.stringify(expression.opperator) +
                ' missing whitespace before opperator.'
            );
        }
        expression.arguments[0] = tokens.pop();

        if (!expression.arguments[0]) {
            throw code.makeError(
                index, index + expression.opperator.length,
                'Missing left-hand <arg>.'
            );
        }

        if (!ValueToken.isCreation(expression.arguments[0]) &&
            !LiteralToken.isCreation(expression.arguments[0]) &&
            !OpperatorToken.isCreation(expression.arguments[0]) &&
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
            index, index + expression.opperator.length,
            'Missing right-hand <arg>.'
        );
    }

    if (!ValueToken.isCreation(expression.arguments[1]) &&
        !LiteralToken.isCreation(expression.arguments[1]) &&
        !OpperatorToken.isCreation(expression.arguments[1]) &&
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
            OpperatorToken.isCreation(scope.token)
        ) {
            scope.close();
            parseMode.close();
        }
    }

    return expression;
}

module.exports = parseExpressionOpperator;

},{"../tokens":28,"../utils":40}],14:[function(require,module,exports){
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

},{"../tokens":28}],15:[function(require,module,exports){
var Token = require('../tokens'),
    TransformToken = Token.tokens.transform,
    OpperatorToken = Token.tokens.opperator,
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

    if (
        OpperatorToken.isCreation(scope.token)
    ) {
        scope.close();
        parseMode.close();
    }

    return transform;
}

module.exports = parseExpressionTransform;

},{"../tokens":28,"../utils":40}],16:[function(require,module,exports){
var Token = require('../tokens'),
    ValueToken = Token.tokens.value,
    OpperatorToken = Token.tokens.opperator,
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

        if (
            OpperatorToken.isCreation(scope.token)
        ) {
            scope.close();
            parseMode.close();
        }

        return value;
    }

    return null;
}

module.exports = parseExpressionValue;

},{"../tokens":28,"../utils":40}],17:[function(require,module,exports){
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

},{}],18:[function(require,module,exports){
// parseHTMLAttr
var Token = require('../tokens'),
    AttrToken = Token.tokens.attr,
    utils = require('../utils');

function parseHTMLAttr(mode, code, tokens, flags, scope, parseMode) {
    var index = code.index,
        length = code.length,
        attr;

    if (!utils.isHTMLIdentifierStart(code.codePointAt(index))) {
        return null;
    }

    attr = new AttrToken(code);

    for (; index < length; index++) {

        if (!utils.isHTMLIdentifier(code.codePointAt(index))) {
            break;
        }

        attr.name += code.charAt(index);
    }

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

},{"../tokens":28,"../utils":40}],19:[function(require,module,exports){
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

},{}],20:[function(require,module,exports){
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

},{}],21:[function(require,module,exports){
var TagToken = require('../tokens')
    .tokens.tag,
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

        scope.push(tag);
        parseMode('ATTR', tag.attrs, flags);

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

},{"../tokens":28,"../utils":40}],22:[function(require,module,exports){
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
exports.parseExpressionOpperator = require('./expression-opperator');
exports.parseExpressionTransform = require('./expression-transform');
exports.parseExpressionTransformEnd = require('./expression-transform-end');

},{"./bars-block":6,"./bars-comment":7,"./bars-insert":8,"./bars-markup":10,"./bars-markup-end":9,"./bars-partial":11,"./expression-literal":12,"./expression-opperator":13,"./expression-transform":15,"./expression-transform-end":14,"./expression-value":16,"./html-attr":18,"./html-attr-end":17,"./html-comment":19,"./html-tag":21,"./html-tag-end":20,"./text":23,"./whitespace":24}],23:[function(require,module,exports){
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

            if (isEntity && utils.isEntity(ch)) {
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

},{"../tokens":28,"../utils":40}],24:[function(require,module,exports){
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

},{"../utils":40}],25:[function(require,module,exports){
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

},{"./token":36}],26:[function(require,module,exports){
var Token = require('./token');

var BlockToken = Token.generate(
    function BlockToken(code) {
        var _ = this;

        if (code) {
            Token.call(_, code);
        }

        _.name = '';

        _.expression = null;
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
            _.expression,
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
            expression: _.expression,
            map: _.map,
            consequent: _.consequent,
            alternate: _.alternate
        };
    },

    _fromArray: function _fromArray(arr) {
        var _ = this;

        _.name = arr[1];

        var expression = new Token.tokens[arr[2][0]]();

        expression.fromArray(arr[2]);

        _.expression = expression;

        _.map = arr[3];

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

},{"./token":36}],27:[function(require,module,exports){
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

},{"./token":36}],28:[function(require,module,exports){
var Token = require('./token');

// program
require('./program');
require('./fragment');

// html markup
require('./text');
require('./tag');
require('./attr');

// bars markup
require('./block');
require('./insert');
require('./partial');

// bars expression
require('./literal');
require('./value');
require('./transform');
require('./opperator');


// TODO: maps

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

},{"./attr":25,"./block":26,"./fragment":27,"./insert":29,"./literal":30,"./opperator":31,"./partial":32,"./program":33,"./tag":34,"./text":35,"./token":36,"./transform":37,"./value":38}],29:[function(require,module,exports){
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

},{"./token":36}],30:[function(require,module,exports){
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

},{"./token":36}],31:[function(require,module,exports){
var Token = require('./token');

var OpperatorToken = Token.generate(
    function OpperatorToken(code) {
        var _ = this;

        if (code) {
            Token.call(_, code);
        }

        _.opperator = 0;

        _.arguments = [];
    }
);


OpperatorToken.definePrototype({
    enumerable: true
}, {
    type: 'opperator'
});

OpperatorToken.definePrototype({
    TYPE_ID: Token.tokens.push(OpperatorToken) - 1,
    toArray: function () {
        var _ = this;
        return [
            _.TYPE_ID,
            _.opperator,
            _.arguments
        ];
    },

    toObject: function () {
        var _ = this;
        return {
            type: _.type,
            TYPE_ID: _.TYPE_ID,
            opperator: _.opperator,
            arguments: _.arguments
        };
    },

    _fromArray: function _fromArray(arr) {
        var _ = this;

        _.opperator = arr[1];

        _.arguments = arr[2].map(function (item) {
            var arg = new Token.tokens[item[0]]();

            arg.fromArray(item);

            return arg;
        });
    },

    toString: function toString() {
        var _ = this,
            str = '';

        if (_.arguments.length === 1) {
            str += _.opperator + _.arguments[0].toString();
        } else if (_.arguments.length === 2) {
            str += _.arguments[0].toString();
            str += ' ' + _.opperator + ' ';
            str += _.arguments[1].toString();
        }

        return str;
    }
});

Token.tokens.opperator = OpperatorToken;
Token;

},{"./token":36}],32:[function(require,module,exports){
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

        _.map = arr[3];
    },
    toString: function toString() {
        var _ = this,
            str = _.indentLevel + '{{>' + _.name;
        str += (_.expression ? ' ' + _.expression.toString() : '');
        str += '}}';
        return str;
    }
});

Token.tokens.partial = PartialToken;;

},{"./token":36}],33:[function(require,module,exports){
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

},{"../../../package":56,"./token":36}],34:[function(require,module,exports){
var Token = require('./token');

var TagToken = Token.generate(
    function TagToken(code) {
        var _ = this;

        if (code) {
            Token.call(_, code);
        }

        _.name = '';

        _.attrs = [];
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
            _.nodesUpdate
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
            nodesUpdate: _.nodesUpdate
        };
    },

    _fromArray: function _fromArray(arr) {
        var _ = this;

        _.name = arr[1];

        _.attrs = arr[2].map(function (item) {
            var node = new Token.tokens[item[0]]();

            node.fromArray(item);

            return node;
        });

        _.attrsUpdate = arr[3];

        _.nodes = arr[4].map(function (item) {
            var node = new Token.tokens[item[0]]();

            node.fromArray(item);

            return node;
        });

        _.nodesUpdate = arr[5];
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

},{"./token":36}],35:[function(require,module,exports){
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

},{"./token":36}],36:[function(require,module,exports){
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
    indentLevel: ''
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

},{"compileit":49}],37:[function(require,module,exports){
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

},{"./token":36}],38:[function(require,module,exports){
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

},{"./token":36}],39:[function(require,module,exports){
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

},{}],40:[function(require,module,exports){
var SELF_CLOSEING_TAGS = require('./self-closing-tags');
var ENTITIES = require('./html-entities');

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


160

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

},{"./html-entities":39,"./self-closing-tags":41}],41:[function(require,module,exports){
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

},{}],42:[function(require,module,exports){
var Generator = require('generate-js'),
    execute = require('./runtime/execute'),
    utils = require('./runtime/utils'),
    Context = require('./runtime/context'),

    pathSpliter = utils.pathSpliter,
    findPath = utils.findPath,

    Nodes = {},

    ARRAY = [],
    MAP = {
        'fragment': 'FRAG',
        'tag': 'TAG',
        'text': 'TEXT',
        'attr': 'ATTR',
        'block': 'BLOCK',
        'insert': 'TEXT',
        'partial': 'PARTIAL'
    };

/**
 * [BarsNode description]
 * @param {[type]} bars     [description]
 * @param {[type]} struct   [description]
 */
var BarsNode = Generator.generate(function BarsNode(frag, bars, struct) {
    var _ = this;

    _.defineProperties({
        fragment: frag || null,
        bars: bars,
        nodes: [],
        parentTag: {
            get: _.getParentTag
        },
        prevDom: {
            get: _.getPrevDom
        },
        type: struct.type,
        name: struct.name,
        value: struct.value,
        arg: struct.expression,
        conFrag: struct.consequent,
        altFrag: struct.alternate,
    });
});

BarsNode.definePrototype({
    update: function update(context) {
        var _ = this;

        _.previousDom = null;

        _._update(context);

        if (_.isDOM) {
            _._elementAppendTo();
            _.parentTag.previousDom = _;
        }

        _.previousDom = null;
    },

    _update: function _update() {
        console.warn('_update method not implemented.');
    },

    appendChild: function appendChild(child) {
        var _ = this;

        _.nodes.push(child);
        child.parent = _;
    },

    appendTo: function appendTo(parent) {
        var _ = this;

        if (parent instanceof Element) {
            _._elementAppendTo(parent);
        }

        if (BarsNode.isCreation(parent)) {
            parent.appendChild(_);
        }
    },

    remove: function remove() {
        var _ = this,
            index = _.parent.nodes.indexOf(_);

        if (index >= 0) {
            _.parent.nodes.splice(index, 1);
        }

        _._elementRemove();
    },

    getParentTag: function getParentTag() {
        var _ = this,
            parent = _.parent,
            oldParent = parent;

        while (parent && !parent.isDOM) {
            oldParent = parent;
            parent = parent.parent;
        }

        return parent || oldParent || null;
    },

    getPrevDom: function getPrevDom() {
        var _ = this;

        return (_.parentTag && _.parentTag.previousDom) || null;
    },

    _elementAppendTo: function _elementAppendTo(parent) {
        var _ = this;

        if (!_.parentTag) return;

        parent = parent || _.parentTag.$el || _.parentTag.$parent;

        if (!parent) return;
        if (_.$el.parentElement) return;

        var prev = _.prevDom;

        if (prev) {
            parent.insertBefore(_.$el, prev.$el.nextSibling);
        } else {
            parent.appendChild(_.$el);
        }
    },

    _elementRemove: function _elementRemove() {
        var _ = this;

        if (_.isDOM && _.$el.parentNode instanceof Element) {
            _.$el.parentNode.removeChild(_.$el);
        }
    },
});


/**
 * [TextNode description]
 * @param {[type]} bars    [description]
 * @param {[type]} struct  [description]
 */
Nodes.TEXT = BarsNode.generate(function TextNode(frag, bars, struct) {
    var _ = this;

    BarsNode.call(this, frag, bars, struct);

    _.defineProperties({
        $el: document.createTextNode(struct.value)
    });
});

Nodes.TEXT.definePrototype({
    isDOM: true,

    appendChild: function appendChild(child) {
        console.warn('appendChild CANNOT be called on TextNodes.');
    },

    _update: function _update(context) {
        var _ = this;

        if (_.arg) {
            _.$el.textContent = execute(_.arg, _.bars.transforms,
                context);
        }
    },
});


/**
 * [TagNode description]
 * @param {[type]} bars    [description]
 * @param {[type]} struct  [description]
 */
Nodes.TAG = BarsNode.generate(function TagNode(frag, bars, struct) {
    var _ = this,
        nodes = struct.nodes || ARRAY,
        attrs = struct.attrs || ARRAY,
        i;

    BarsNode.call(this, frag, bars, struct);

    _.defineProperties({
        $el: document.createElement(struct.name),
        attrs: []
    });

    for (i = 0; i < nodes.length; i++) {
        var node = nodes[i];
        _.appendChild(new Nodes[MAP[node.type]](frag, bars, node));
    }

    for (i = 0; i < attrs.length; i++) {
        var attr = attrs[i];
        _.addAttr(new Nodes[MAP[attr.type]](frag, bars, attr));
    }

});

Nodes.TAG.definePrototype({
    isDOM: true,

    _update: function _update(context) {
        var _ = this,
            i;

        for (i = 0; i < _.attrs.length; i++) {
            _.attrs[i].update(context);
        }

        for (i = 0; i < _.nodes.length; i++) {
            _.nodes[i].update(context);
        }
    },

    addAttr: function addAttr(child) {
        var _ = this;

        _.attrs.push(child);
        child.parent = _;
    },
});

/**
 * [AttrNode description]
 * @param {[type]} bars    [description]
 * @param {[type]} struct  [description]
 */
Nodes.ATTR = BarsNode.generate(function AttrNode(frag, bars, struct) {
    var _ = this,
        nodes = struct.nodes || ARRAY;

    BarsNode.call(this, frag, bars, struct);

    _.defineProperties({
        $el: document.createElement('div'),
    });

    for (var i = 0; i < nodes.length; i++) {
        var node = nodes[i];
        _.appendChild(new Nodes[MAP[node.type]](frag, bars, node));
    }
});

Nodes.ATTR.definePrototype({
    isDOM: true,
    type: 'ATTR',
    _update: function _update(context) {
        var _ = this,
            i;

        for (i = 0; i < _.nodes.length; i++) {
            _.nodes[i].update(context);
        }
    },
    _elementAppendTo: function _elementAppendTo() {
        var _ = this,
            parent = _.parentTag.$el;

        if (parent instanceof Element) {
            parent.setAttribute(_.name, _.$el.textContent);
        }
    },
    _elementRemove: function _elementRemove() {
        var _ = this,
            parent = _.parentTag.$el;

        if (parent instanceof Element) {
            parent.removeAttribute(_.name);
        }
    }
});


/**
 * [BlockNode description]
 * @param {[type]} bars    [description]
 * @param {[type]} struct  [description]
 */
Nodes.BLOCK = BarsNode.generate(function BlockNode(frag, bars, struct) {
    var _ = this;

    BarsNode.call(this, frag, bars, struct);

    _.path = pathSpliter(findPath(_.arg));
});

Nodes.BLOCK.definePrototype({
    type: 'BLOCK',

    createFragment: function createFragment(path) {
        var _ = this,
            frag = new Nodes.FRAG(_.fragment, _.bars, _.conFrag);

        _.appendChild(frag);

        return frag;
    },

    _update: function _update(context) {
        var _ = this,
            con,
            arg,
            i;

        if (typeof _.bars.blocks[_.name] === 'function') {
            arg = execute(_.arg, _.bars.transforms, context);
            con = _.bars.blocks[_.name].call(_, arg);
        } else {
            throw new Error('Block helper not found: ' + _.name);
        }

        if (con) {
            if (!_.nodes.length) {
                _.createFragment();
            }

            for (i = 0; i < _.nodes.length; i++) {
                _.nodes[i].update(context);
            }

            if (_.alternate) {
                _.alternate._elementRemove();
            }
        } else {
            for (i = 0; i < _.nodes.length; i++) {
                _.nodes[i]._elementRemove();
            }

            if (!_.alternate && _.altFrag) {
                _.alternate = new Nodes[MAP[_.altFrag.type]](
                    _.fragment,
                    _.bars,
                    _.altFrag
                );
                _.alternate.parent = _;
            }

            _.alternate.update(context);
        }
    },
    _elementAppendTo: function _elementAppendTo() {},
    _elementRemove: function _elementRemove() {
        var _ = this,
            i;

        for (i = 0; i < _.nodes.length; i++) {
            _.nodes[i]._elementRemove();
        }

        if (_.alternate) {
            _.alternate._elementRemove();
        }
    }
});


/**
 * [PartialNode description]
 * @param {[type]} bars    [description]
 * @param {[type]} struct  [description]
 */
Nodes.PARTIAL = BarsNode.generate(function PartialNode(frag, bars, struct) {
    var _ = this;

    BarsNode.call(this, frag, bars, struct);

    _.path = pathSpliter(findPath(_.arg));
});

Nodes.PARTIAL.definePrototype({
    _update: function _update(context) {
        var _ = this;

        if (!_.partial) {
            var partial = _.bars.partials[_.name];

            if (partial && typeof partial === 'object') {
                _.partial = new Nodes.FRAG(_.fragment, _.bars,
                    partial.struct);
                _.partial.parent = _;
                if (
                    (
                        _.path.length === 1 &&
                        _.path[0] !== 'this' &&
                        _.path[0] !== '.' &&
                        _.path[0] !== ''
                    ) ||
                    _.path.length > 1
                ) {
                    _.partial.context.path = _.path;
                }
            } else {
                throw new Error('Partial not found: ' + _.name);
            }
        }

        var arg = execute(_.arg, _.bars.transforms, context);
        _.partial.context.data = arg;
        _.partial.update(context);
    },

    _elementRemove: function _elementRemove() {
        var _ = this;

        if (_.partial) {
            _.partial._elementRemove();
        }
    }
});


/**
 * [FragNode description]
 * @param {[type]} bars    [description]
 * @param {[type]} struct  [description]
 */
Nodes.FRAG = BarsNode.generate(function FragNode(frag, bars, struct) {
    // console.log('>>>>>', struct);
    var _ = this,
        nodes = struct.nodes || ARRAY;

    BarsNode.call(this, frag, bars, struct);

    _.context = new Context(null, _, '');

    for (var i = 0; i < nodes.length; i++) {
        var node = nodes[i];
        if (MAP[node.type])
            _.appendChild(new Nodes[MAP[node.type]](_, bars, node));
    }
});

Nodes.FRAG.definePrototype({
    _update: function _update(data) {
        var _ = this;

        if (!Context.isCreation(data)) {
            _.context.data = data;
        }

        for (var i = 0; i < _.nodes.length; i++) {
            _.nodes[i].update(_.context);
        }
        _.context.data = null;
    },

    _elementAppendTo: function _elementAppendTo(parent) {
        var _ = this;

        _.$parent = parent;
    },
    _elementRemove: function _elementRemove() {
        var _ = this;

        for (var i = 0; i < _.nodes.length; i++) {
            _.nodes[i]._elementRemove();
        }

        _.$parent = null;
    }
});

module.exports = Nodes.FRAG;

},{"./runtime/context":44,"./runtime/execute":45,"./runtime/utils":47,"generate-js":55}],43:[function(require,module,exports){
var Generator = require('generate-js'),
    Frag = require('./frag');

var Renderer = Generator.generate(function Renderer(bars, struct) {
    var _ = this;

    _.defineProperties({
        bars: bars,
        struct: struct
    });
});

Renderer.definePrototype({
    render: function render() {
        var _ = this;
        return new Frag(null, _.bars, _.struct);
    },
});

module.exports = Renderer;

},{"./frag":42,"generate-js":55}],44:[function(require,module,exports){
var Generator = require('generate-js');
var utils = require('./utils');
var pathSpliter = utils.pathSpliter;
var pathResolver = utils.pathResolver;

var Context = Generator.generate(function Context(data, fragment, path) {
    var _ = this;

    _.data = data;
    _.fragment = fragment;
    _.context = null;
    _.path = path;
    _.__path = [];

    _.props = {
        get key() {
            if (!_.path.length && _.context) {
                return _.context.props.key;
            }
            return _.path[_.path.length - 1];
        },
        get index() {
            if (!_.path.length && _.context) {
                return _.context.props.index;
            }
            return _.path[_.path.length - 1];
        }
    };
});

Context.definePrototype({
    path: {
        get: function path() {
            return this.__path || [];
        },
        set: function path(path) {
            var _ = this;

            // path = pathSpliter(path);
            var fragment = _.fragment;

            _.data = null;
            _.context = null;

            if (path[0] === '~' && fragment.fragment) {

                while (fragment.fragment) {
                    fragment = fragment.fragment;
                }
                _.context = fragment.context;
                path.shift();
            } else if (path[0] === '..' && fragment.fragment &&
                fragment
                .fragment
                .fragment) {
                _.context = fragment.fragment.context;

                while (path[0] === '..' && _.context.context) {

                    path = pathResolver(_.context.path, path);

                    _.context = _.context.context;
                }
            }

            _.__path = path;
        }
    },

    lookup: function lookup(path) {
        var _ = this,
            i = 0;

        // path = pathSpliter(path);
        // console.log('lookup:', path)

        if (!_.context && _.fragment.fragment) {
            _.context = _.fragment.fragment.context;
        }

        if (path[0] === '~' && _.context) {
            return _.context.lookup(path);
        }

        if (path[0] === '..' && _.context) {
            return _.context.lookup(
                pathResolver(_.path, path)
            );
        }

        if (
            path[0] === 'this' ||
            path[0] === '.' ||
            path[0] === '~' ||
            path[0] === '@'
        ) {
            i = 1;
        }

        if (!_.data && _.context) {
            _.data = _.context.lookup(_.path);
        }

        if (!_.data) return;

        var value = (path[0] === '@' ? _.props : _.data);

        // console.log('lookup:', value)


        for (; value && i < path.length; i++) {

            if (value !== null && value !== void(0)) {
                value = value[path[i]];
            } else {
                value = undefined;
            }
        }
        // console.log('lookup:', value)

        return value;
    }
});

module.exports = Context;

},{"./utils":47,"generate-js":55}],45:[function(require,module,exports){
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
            result = context.lookup(token.path);
        } else if (
            token.type === 'opperator' &&
            token.arguments.length === 1
        ) {
            result = logic[token.opperator](
                run(token.arguments[0])
            );
        } else if (
            token.type === 'opperator' &&
            token.arguments.length === 2
        ) {
            if (token.opperator === '||') {
                result = run(token.arguments[0]) || run(token.arguments[1]);
            } else if (token.opperator === '&&') {
                result = run(token.arguments[0]) && run(token.arguments[1]);
            } else {
                result = logic[token.opperator](
                    run(token.arguments[0]),
                    run(token.arguments[1])
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

},{"./logic":46}],46:[function(require,module,exports){
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

},{}],47:[function(require,module,exports){
exports.pathResolver = function pathResolver(base, path) {
    base = base.slice();
    path = path.slice();

    while (base.length && path[0] === '..') {
        path.shift();
        base.pop();
    }

    return base.concat(path);
};

exports.pathSpliter = function pathSpliter(path) {
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
};

function findPath(arg) {
    if (arg) {
        if (arg.type === 'insert') {
            return arg.path;
        } else if (
            arg.type === 'opperator' ||
            arg.type === 'transform'
        ) {
            for (var i = 0; i < arg.arguments.length; i++) {
                var argI = findPath(arg.arguments[i]);
                if (argI.type === 'insert') {
                    return argI.argument;
                }
            }
        }
    }

    return '';
}

exports.findPath = findPath;

},{}],48:[function(require,module,exports){
var Generator = require('generate-js');

var Transfrom = Generator.generate(function Transfrom() {});

Transfrom.definePrototype({
    log: function log() {
        var args = Array.prototype.slice.call(arguments);
        args.unshift('Bars:');
        console.log.aplly(console, args);
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

module.exports = Transfrom;

},{"generate-js":55}],49:[function(require,module,exports){
exports.Compiler = require('./lib/compiler');
exports.Token = require('./lib/token');

},{"./lib/compiler":51,"./lib/token":53}],50:[function(require,module,exports){
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

},{"./utils":54,"generate-js":55}],51:[function(require,module,exports){
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
            throw code.makeError(
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
                        JSON.stringify(token.source(code))
                    );
                }
            }

            index = code.index;
        }
    }
});

module.exports = Compiler;

},{"./code-buffer":50,"./scope":52,"./token":53,"./utils":54,"generate-js":55}],52:[function(require,module,exports){
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

},{"./token":53,"./utils":54,"generate-js":55}],53:[function(require,module,exports){
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

},{"./utils":54,"generate-js":55}],54:[function(require,module,exports){
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

},{}],55:[function(require,module,exports){
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

},{}],56:[function(require,module,exports){
module.exports={
  "name": "bars",
  "version": "0.4.0",
  "description": "Bars is a light weight high performance templating system.Bars emits DOM rather than DOM-strings, this means the DOM state is preserved even if data updates happens.",
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
    "compileit": "^1.0.0",
    "generate-js": "^3.1.2"
  },
  "devDependencies": {
    "browserify": "^11.0.1",
    "colors": "^1.1.2",
    "gulp": "^3.9.1",
    "gulp-minify": "0.0.14",
    "stringify": "^5.1.0",
    "vinyl-buffer": "^1.0.0",
    "vinyl-source-stream": "^1.1.0"
  }
}

},{}]},{},[2])(2)
});