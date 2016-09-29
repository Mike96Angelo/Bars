(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports = require('./lib');

},{"./lib":12}],2:[function(require,module,exports){
var Generator = require('generate-js'),
    context = require('./runtime/context'),
    compile = require('./compiler'),
    Renderer = require('./renderer'),
    Blocks = require('./blocks'),
    Transform = require('./transforms');

var Bars = Generator.generate(function Bars() {
    var _ = this;

    _.defineProperties({
        blocks: Blocks.create(),
        partials: {},
        transforms: Transform.create()
    });
});

Bars.definePrototype({
    context:context,
    compile: function compile(template, mode) {
        var _ = this;
        return _.build( _.parse(template, mode) );
    },

    parse: function parse(template, mode) {
        return compile(template, mode);
    },

    build: function build(parsedTemplate) {
        var _ = this;
        return Renderer.create( _, parsedTemplate );
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

module.exports = window.Bars = Bars;

},{"./blocks":3,"./compiler":7,"./renderer":13,"./runtime/context":14,"./transforms":17,"generate-js":18}],3:[function(require,module,exports){
var Generator = require('generate-js');

var Blocks = Generator.generate(function Blocks() {});

Blocks.definePrototype({
    if: function ifBlock(con) {
        return con;
    },

    unless: function unlessBlock(con) {
        return !con;
    },

    with: function withBlock(data) {
        var _ = this;

        if (data && typeof data === 'object') {
            _.context = _.context.newContext(data);

            return true;
        }

        return false;
    },

    each: function eachBlock(data) {
        var _ = this,
            i;

        if (data && typeof data === 'object') {
            var keys = Object.keys(data);

            _.context = _.context.newContext(data);

            if (keys.length) {
                // TODO: This should be smarter.

                // remove extra nodes
                for (i = _.nodes.length - 1; i >= keys.length; i--) {
                    _.nodes[i].remove();
                    var r = true;
                }

                // console.log('remove', r, keys.length, _.nodes.length)

                // update node paths
                for (i = 0; i < keys.length && i < _.nodes.length; i++) {
                    _.nodes[i].path = keys[i];
                    var u = true;
                }

                // console.log('update', u, keys.length, _.nodes.length)

                // add needed nodes
                for (i = _.nodes.length; i < keys.length; i++) {
                    _.createFragment(keys[i]);
                    var a = true;
                }

                // console.log('add', a, keys.length, _.nodes.length)

                return true;
            }
        }

        return false;
    },

    reverse: function reverseBlock(data) {
        var _ = this,
            i;

        if (data && typeof data === 'object') {
            var keys = Object.keys(data).reverse();

            _.context = _.context.newContext(data);

            if (keys.length) {
                // TODO: This should be smarter.

                // remove extra nodes
                for (i = _.nodes.length - 1; i >= keys.length; i--) {
                    _.nodes[i].remove();
                    var r = true;
                }

                // update node paths
                for (i = 0; i < keys.length && i < _.nodes.length; i++) {
                    _.nodes[i].path = keys[i];
                    var u = true;
                }

                // add needed nodes
                for (i = _.nodes.length; i < keys.length; i++) {
                    _.createFragment(keys[i]);
                    var a = true;
                }

                return true;
            }
        }

        return false;
    }
});

module.exports = Blocks;

},{"generate-js":18}],4:[function(require,module,exports){
function CodeBuffer(str, file) {
    this.reset();
    this._buffer = str;
    this._file = file;
}

CodeBuffer.prototype = {
    reset: function reset() {
        this.line   = 1;
        this.column = 1;
        this._index = 0;
        this._currentLine = 0;
    },
    get currentLine() {
        var lineText = '',
            i = this._currentLine;

        while (i < this.length) {
            lineText += this._buffer[i];
            if (this._buffer.codePointAt(i) === 10) {
                break;
            }
            i++;
        }

        return lineText;
    },

    get buffer() {
        return this._buffer;
    },


    get index() {
        return this._index;
    },

    set index(val) {
        var i = this._index,
            update = false;

        val = Math.min(this.length, val);
        val = Math.max(0, val);

        if (i == val) return;

        if (i > val) {
            // throw new Error('========' + val + ' < ' +i+'=======');
            this.reset();
            i = this._index;
        }

        if (this.buffer.codePointAt(i) === 10) {
            update = true;
            i++;
        }

        for (; i <= val; i++) {
            if (update) {
                this._currentLine = i;
                this.line++;
                update = false;
            } else {
                this.column++;
            }

            if (this.buffer.codePointAt(i) === 10) {
                update = true;
            }
        }
        this.column = val - this._currentLine + 1;
        this._index = val;
    },

    get length() {
        return this._buffer.length;
    },

    next: function next() {
        this.index++;
        return this.charAt(this.index);
    },

    get left() {
        return this._index < this.length;
    },

    charAt: function charAt(i) {
        return this._buffer[i] || 'EOF';
    },

    codePointAt: function codePointAt(i) {
        return this._buffer.codePointAt(i);
    },

    slice: function slice(startIndex, endIndex) {
        return this._buffer.slice(startIndex, endIndex);
    },

    makeError: function makeError (message, tokenLength) {
        tokenLength = tokenLength || 1;

        var currentLine = this.currentLine,
            tokenIdentifier =
                currentLine[currentLine.length - 1] === '\n' ? '' : '\n',
            i;

        for (i = 1; i < this.column; i++) {
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
            (this._file ? this._file + ':' : '') +
            this.line +
            ':' +
            this.column +
            ' index ' +
            this.index +
            '\n\n' +
            currentLine +
            tokenIdentifier +
            '\n' ;
    }
};

module.exports = CodeBuffer;

},{}],5:[function(require,module,exports){
var CodeBuffer = require('./code-buffer'),
    Token      = require('./token');

function bufferSlice(code, range) {
    return JSON.stringify(
        code.slice(Math.max(0, code.index-range), code.index)
    ).slice(1, -1) +
    JSON.stringify(code.charAt(code.index) || 'EOF')
    .slice(1, -1).green.underline +
    JSON.stringify(
        code.slice(
            code.index + 1,
            Math.min(code.length, code.index + 1 + range)
        )
    ).slice(1, -1);
}


var SELF_CLOSEING_TAGS = require('./self-closing-tags');
var ENTITIES           = require('./html-entities');
var TYPES              = require('./token-types');

function HTML_IDENTIFIER_START(ch) {
    return  (0x0041 <= ch && ch <= 0x005a) ||
            (0x0061 <= ch && ch <= 0x007a);
}

function HTML_ENTITY(ch) {
    /* ^[0-9A-Za-z]$ */
    return  (0x0030 <= ch && ch <= 0x0039) ||
            (0x0041 <= ch && ch <= 0x005a) ||
            (0x0061 <= ch && ch <= 0x007a);
}

function HTML_IDENTIFIER(ch) {
    /* ^[0-9A-Z_a-z-]$ */
    return  ch === 0x002d ||
            (0x0030 <= ch && ch <= 0x0039) ||
            (0x0041 <= ch && ch <= 0x005a) ||
            ch === 0x005f ||
            (0x0061 <= ch && ch <= 0x007a);
}

function WHITESPACE(ch) {
    /* ^\s$ */
    return  (0x0009 <= ch && ch <= 0x000d) ||
            ch === 0x0020 ||
            ch === 0x00a0 ||
            ch === 0x1680 ||
            ch === 0x180e ||
            (0x2000 <= ch && ch <= 0x200a) ||
            (0x2028 <= ch && ch <= 0x2029) ||
            ch === 0x202f ||
            ch === 0x205f ||
            ch === 0x3000 ||
            ch === 0xfeff;
}

function getHTMLUnEscape(str) {
    var code;

    code = ENTITIES[str.slice(1, -1)];

    if (typeof code !== 'number' && str[1] === '#') {
        code = parseInt( str.slice(2, -1), 0x000a);
    }

    if (typeof code === 'number' && !isNaN(code)){
        return String.fromCharCode(code);
    }

    return str;
}

//////////
// TEXT //
//////////

function TEXT(mode, code, tokens, close) {
    var index = code.index,
        isEntity = false,
        entityStr = '',
        text = new Token(code, TYPES.TEXT);

    for (; index < code.length; index++) {
        ch = code.codePointAt(index);

        if (
            code.codePointAt(index)     === 0x007b /* { */ &&
            code.codePointAt(index + 1) === 0x007b /* { */
        ) {
            break;
        }
    }

    if (code.index < index) {
        code.index = index;

        text.close(code);

        text.value = text.source(code);

        return text;
    }

    return null;
}


/////////
// DOM //
/////////

function HTML_COMMENT(mode, code, tokens, close) {
    var index = code.index,
        length = code.length,
        comment;

    if ( /* <!-- */
        code.codePointAt(index)   === 0x003c &&
        code.codePointAt(++index) === 0x0021 &&
        code.codePointAt(++index) === 0x002d &&
        code.codePointAt(++index) === 0x002d
    ) {
        comment = new Token(code, TYPES.HTML_COMMENT);
        index++;

        for (; index < length; index++) {
            if ( /* --> */
                code.codePointAt(index)     === 0x002d &&
                code.codePointAt(index + 1) === 0x002d &&
                code.codePointAt(index + 2) === 0x003e
            ) {
                index += 3;
                code.index = index;
                comment.close(code);

                comment.value = comment.source(code);

                return comment;
            }
        }

        throw code.makeError(
            'Unclosed Comment: Expected "-->" to fallow "<!--".',
            4
        );
    }

    return null;
}

function HTML_CLOSE_TAG(mode, code, tokens, close) {
    var index = code.index,
        length = code.length,
        tag;

    if ( /* </ */
        code.codePointAt(index)   === 0x003c &&
        code.codePointAt(++index) === 0x002f
    ) {
        tag = new Token(code, TYPES.HTML_TAG);
        tag.name = '';

        index++;

        if (!HTML_IDENTIFIER_START(code.codePointAt(index))) {
            code.index = index;
            throw code.makeError(
                'Unexpected Token: Expected <[A-Za-z]> but found ' +
                JSON.stringify(code.charAt(index)) +
                '.'
            );
        }

        for (; index < length; index++) {
            ch = code.codePointAt(index);

            if (HTML_IDENTIFIER(ch)) {
                tag.name += code.charAt(index);
            } else if (ch === 0x003e) { /* > */
                index++;
                code.index = index;
                tag.close(code);

                if (!close || close.type !== tag.type) {
                    code.index = tag.range[0];
                    throw code.makeError(
                        'Unexpected Closing Tag: ' +
                        JSON.stringify(tag.source(code)) +
                        '.',
                        tag.length
                    );
                }

                if (close.name !== tag.name) {
                    code.index = tag.range[0];
                    throw code.makeError(
                        'Mismatch Closing Tag: Expected ' +
                        JSON.stringify('</' + close.name + '>') +
                        ' but found ' +
                        JSON.stringify(tag.source(code)) +
                        '.',
                        tag.length
                    );
                }

                close.close(code);
                return true;
            } else {
                code.index = index;
                throw code.makeError(
                    'Unexpected Token: Expected ' +
                    JSON.stringify('>') +
                    ' but found ' +
                    JSON.stringify(code.charAt(index)) +
                    '.'
                );
            }
        }
    }

    return null;
}

function HTML_OPEN_TAG(mode, code, tokens, close) {
    var index = code.index,
        length = code.length,
        tag;
    if ( /* < */
        code.codePointAt(index) === 0x003c
    ) {
        tag = new Token(code, TYPES.HTML_TAG);
        tag.name = '';
        tag.attrs = [];
        tag.nodes = [];

        index++;

        if (!HTML_IDENTIFIER_START(code.codePointAt(index))) {
            code.index = index;
            throw code.makeError(
                'Unexpected Token: Expected <[A-Za-z]> but found ' +
                JSON.stringify(code.charAt(index)) +
                '.'
            );
        }

        for (; index < length; index++) {
            ch = code.codePointAt(index);

            if (HTML_IDENTIFIER(ch)) {
                tag.name += code.charAt(index);
            } else {
                break;
            }
        }

        code.index = index;

        parseTokens('ATTR', code, tag.attrs, tag);

        if (!tag.closed) {
            throw code.makeError(
                'Unclosed Tag: Expected ' +
                JSON.stringify('>') +
                ' but found ' +
                JSON.stringify(code.charAt(code.index)) +
                '.',
                tag.length
            );
        }

        if (SELF_CLOSEING_TAGS.indexOf(tag.name) !== -1) {
            tag.selfClosing = true;
        }

        if (tag.selfClosing || tag.selfClosed) {
            tag.close(code);

            return tag;
        }

        delete tag.closed;

        parseTokens('DOM', code, tag.nodes, tag);

        if (!tag.closed) {
            code.index = tag.range[0];

            throw code.makeError(
                'Unclosed Tag: Expected ' +
                JSON.stringify('</' + tag.name + '>') +
                ' to fallow ' +
                JSON.stringify(tag.source(code)) +
                '.',
                tag.length
            );
        }

        return tag;
    }

    return null;
}

function HTML_TEXT(mode, code, tokens, close) {
    var ch,
        index = code.index,
        isEntity = false,
        entityStr = '',
        text = new Token(code, TYPES.HTML_TEXT);

    text.value = '';

    for (; index < code.length; index++) {
        ch = code.codePointAt(index);

        if (
            ch === 0x003c /* < */ ||
            ch === 0x007b /* { */ &&
            code.codePointAt(index + 1) === 0x007b /* { */
        ) {
            text.value += entityStr;
            break;
        }

        if (ch === 0x0026 /* & */) {
            isEntity = true;
            entityStr = code.charAt(index);

            continue;
        } else if (isEntity && ch === 0x003b /* ; */) {
            entityStr += code.charAt(index);

            text.value += getHTMLUnEscape(entityStr);

            isEntity = false;
            entityStr = '';

            continue;
        }

        if (isEntity && HTML_ENTITY(ch)) {
            entityStr += code.charAt(index);
        } else {
            text.value += entityStr;
            isEntity = false;
            entityStr = '';

            text.value += code.charAt(index);
        }
    }

    if (text.value) {
        code.index = index;

        text.close(code);

        return text;
    }

    return null;
}

function HTML_OPEN_TAG_END(mode, code, tokens, close) {
    var ch = code.codePointAt(code.index);
        /* > */
    if (ch === 0x003e) {
        code.index++;
        close.close(code);
        return true;
    } else if ( /* /> */
        ch === 0x002f &&
        code.codePointAt(code.index + 1) === 0x003e
    ) {
        code.index += 2;
        close.close(code);
        close.selfClosed = true;
        return true;
    }

    return null;
}

function HTML_ATTR(mode, code, tokens, close) {

    var index = code.index,
        length = code.length,
        attr = new Token(code, TYPES.HTML_ATTR);
        attr.name = '';
        attr.nodes = [];

    if (!HTML_IDENTIFIER_START(code.codePointAt(index))) {
        return null;
    }

    for (; index < length; index++) {

        if (!HTML_IDENTIFIER(code.codePointAt(index))) {
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

                parseTokens('VALUE', code, attr.nodes, attr);
            } else {
                code.index = index;
                throw code.makeError(
                    'Unexpected Token: Expected "\"" but found ' +
                    JSON.stringify(code.charAt(index))
                );
            }
        } else {
            code.index = index;
            attr.close(code);
        }

        if (!attr.closed) {
            code.index = attr.range[0] + attr.name.length + 1;
            throw code.makeError(
                'Unclosed String: Expected "\"" to fallow "\""'
            );
        }

        return attr;
    }

    return null;
}


//////////
// ATTR //
//////////

function STRING_END(mode, code, tokens, close) {
    if (code.codePointAt(code.index) === 0x0022 /* " */) {
        code.index++;
        close.close(code);
        return true;
    }

    return null;
}

function STRING_TEXT(mode, code, tokens, close) {
    var ch,
        index = code.index,
        length = code.length,
        text = new Token(code, TYPES.STRING_TEXT);

        text.value = '';

    for (; index < length; index++) {
        ch = code.codePointAt(index);

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

    if (index > code.index) {
        code.index = index;
        text.close(code);
        text.value = text.source(code);
        return text;
    }

    return null;
}

function WHITE_SPACE(mode, code, tokens, close) {
    var index = code.index,
        length = code.length,
        whitespace = 0;

    for (; index < length; index++) {
        if (!WHITESPACE(code.codePointAt(index))) {
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

//////////
// BARS //
//////////

function BARS_COMMENT(mode, code, tokens, close) {
    var index = code.index,
        length = code.length,
        comment;

    if ( /* {{! */
        code.codePointAt(index)   === 0x007b &&
        code.codePointAt(++index) === 0x007b &&
        code.codePointAt(++index) === 0x0021
    ) {
        comment = new Token(code, TYPES.BARS_COMMENT);
        index++;

        for (; index < length; index++) {
            if ( /* }} */
                code.codePointAt(index) === 0x007d &&
                code.codePointAt(index + 1) === 0x007d
            ) {
                index += 2; /* for }} */
                code.index = index;
                comment.close(code);

                comment.value = comment.source(code);

                return comment;
            }
        }

        throw code.makeError(
            'Unclosed Comment: Expected "}}" to fallow "{{!".',
            3
        );
    }

    return null;
}

function BARS_CODE_COMMENT(mode, code, tokens, close) {
    var index = code.index,
        length = code.length,
        comment;

    if ( /* {{!-- */
        code.codePointAt(index)   === 0x007b &&
        code.codePointAt(++index) === 0x007b &&
        code.codePointAt(++index) === 0x0021 &&
        code.codePointAt(++index) === 0x002d &&
        code.codePointAt(++index) === 0x002d
    ) {
        comment = new Token(code, TYPES.BARS_COMMENT);
        comment.more = true;
        index++;

        for (; index < length; index++) {
            if ( /* --}} */
                code.codePointAt(index)     === 0x002d &&
                code.codePointAt(index + 1) === 0x002d &&
                code.codePointAt(index + 2) === 0x007d &&
                code.codePointAt(index + 3) === 0x007d
            ) {
                index += 4; /* for --}} */
                code.index = index;
                comment.close(code);

                comment.value = comment.source(code);

                return comment;
            }
        }

        throw code.makeError(
            'Unclosed Comment: Expected "--}}" to fallow "{{!--".',
            5
        );
    }

    return null;
}

function BARS_CLOSE_BLOCK(mode, code, tokens, close) {
    var index = code.index,
        length = code.length,
        block;

    if ( /* {{/ */
        code.codePointAt(index)   === 0x007b &&
        code.codePointAt(++index) === 0x007b &&
        code.codePointAt(++index) === 0x002f
    ) {
        block = new Token(code, TYPES.BARS_BLOCK);
        block.name = '';

        index++;

        if (!HTML_IDENTIFIER_START(code.codePointAt(index))) {
            code.index = index;
            throw code.makeError(
                'Unexpected Token: Expected <[A-Za-z]> but found ' +
                JSON.stringify(code.charAt(index)) +
                '.'
            );
        }

        for (; index < length; index++) {
            ch = code.codePointAt(index);

            if (HTML_IDENTIFIER(ch)) {
                block.name += code.charAt(index);
            } else if ( /* }} */
                ch === 0x007d &&
                code.codePointAt(index + 1) === 0x007d
            ) {
                index+=2;
                code.index = index;
                block.close(code);

                if (!close || close.type !== block.type) {
                    code.index = block.range[0];
                    throw code.makeError(
                        'Unexpected Closing Block: ' +
                        JSON.stringify(block.source(code)) +
                        '.',
                        block.length
                    );
                }

                if (close.name !== block.name) {
                    code.index = block.range[0];
                    throw code.makeError(
                        'Mismatch Closing Block: Expected ' +
                        JSON.stringify('{{/' + close.name + '}}') +
                        ' but found ' +
                        JSON.stringify(block.source(code)) +
                        '.',
                        block.length
                    );
                }

                close.close(code);
                return true;
            } else {
                code.index = index;
                throw code.makeError(
                    'Unexpected Token: Expected ' +
                    JSON.stringify('}}') +
                    ' but found ' +
                    JSON.stringify(code.charAt(index)) +
                    '.'
                );
            }
        }
    }

    return null;
}

function BARS_ELSE_BLOCK(mode, code, tokens, close) {
    var index = code.index,
        length = code.length,
        block;

    if ( /* {{else}} */
        code.codePointAt(index)   === 0x007b &&
        code.codePointAt(++index) === 0x007b &&
        code.codePointAt(++index) === 0x0065 &&
        code.codePointAt(++index) === 0x006c &&
        code.codePointAt(++index) === 0x0073 &&
        code.codePointAt(++index) === 0x0065 &&
        code.codePointAt(++index) === 0x007d &&
        code.codePointAt(++index) === 0x007d
    ) {
        block = new Token(code, TYPES.BARS_ELSE);
        index++;
        code.index = index;
        block.close(code);

        if (!close) {
            code.index = block.range[0];
            throw code.makeError(
                'Unexpected Token: ' +
                JSON.stringify(block.source(code)) +
                '.',
                block.length
            );
        }

        close.elsed = block;

        close.close(code);

        return true;
    }

    return null;
}

function BARS_OPEN_BLOCK(mode, code, tokens, close) {
    var index = code.index,
        length = code.length,
        block;
    if ( /* {{# */
        code.codePointAt(index)   === 0x007b &&
        code.codePointAt(++index) === 0x007b &&
        code.codePointAt(++index) === 0x0023
    ) {
        block = new Token(code, TYPES.BARS_BLOCK);
        block.name = '';
        block.arguments = [];

        index++;

        if (!HTML_IDENTIFIER_START(code.codePointAt(index))) {
            code.index = index;
            throw code.makeError(
                'Unexpected Token: Expected <[A-Za-z]> but found ' +
                JSON.stringify(code.charAt(index)) +
                '.'
            );
        }

        for (; index < length; index++) {
            ch = code.codePointAt(index);

            if (HTML_IDENTIFIER(ch)) {
                block.name += code.charAt(index);
            } else {
                break;
            }
        }

        code.index = index;

        parseTokens('LOGIC', code, block.arguments, block);

        block.argument = block.arguments[0];

        if (block.arguments.length > 1) {
            code.index = block.arguments[1].range[0];
            throw code.makeError(
                'Unexpected Token: ' +
                JSON.stringify(block.arguments[1].source(code)) + '.',
                block.arguments[1].length
            );
        }
        delete block.arguments;

        if (!block.closed) {
            throw code.makeError(
                'Unclosed Block: Expected ' +
                JSON.stringify('}}') +
                ' but found ' +
                JSON.stringify(code.charAt(code.index)) +
                '.',
                block.length
            );
        }

        if (!block.argument) {
            code.index -= 2;
            throw code.makeError('Missing <arg>.');
        }

        delete block.closed;

        block.consequent = new Token(code, TYPES.FRAGMENT);
        block.consequent.nodes = [];

        parseTokens(mode, code, block.consequent.nodes, block);
        index = code.index;
        code.index = block.consequent.nodes[
            block.consequent.nodes.length - 1
        ].range[1];
        block.consequent.close(code);
        code.index = index;
        if (block.elsed) {

            delete block.elsed;
            delete block.closed;

            block.alternate = new Token(code, TYPES.FRAGMENT);
            block.alternate.nodes = [];

            parseTokens(mode, code, block.alternate.nodes, block);
            index = code.index;
            code.index = block.alternate.nodes[
                block.alternate.nodes.length - 1
            ].range[1];
            block.alternate.close(code);
            code.index = index;
            if (block.elsed) {
                code.index = block.elsed.range[0];
                throw code.makeError(
                    'Unexpected Token: ' +
                    JSON.stringify(block.elsed.source(code)),
                    block.elsed.length
                );
            }
        }

        if (!block.closed) {
            code.index = block.range[0];

            throw code.makeError(
                'Unclosed Block: Expected ' +
                JSON.stringify('{{/' + block.name + '}}') +
                ' to fallow ' +
                JSON.stringify(block.source(code)) +
                '.',
                block.length
            );
        }

        return block;
    }

    return null;
}

function BARS_OPEN_INSERT(mode, code, tokens, close) {
    var index = code.index,
        length = code.length,
        block;
    if ( /* {{ */
        code.codePointAt(index)   === 0x007b &&
        code.codePointAt(++index) === 0x007b
    ) {
        block = new Token(code, TYPES.BARS_INSERT);
        block.arguments = [];

        index++;

        code.index = index;

        parseTokens('LOGIC', code, block.arguments, block);

        block.argument = block.arguments[0];

        if (block.arguments.length > 1) {
            code.index = block.arguments[1].range[0];
            throw code.makeError(
                'Unexpected Token: ' +
                JSON.stringify(block.arguments[1].source(code)) + '.',
                block.arguments[1].length
            );
        }
        delete block.arguments;

        if (!block.closed) {
            throw code.makeError(
                'Unclosed Block: Expected ' +
                JSON.stringify('}}') +
                ' but found ' +
                JSON.stringify(code.charAt(code.index)) +
                '.',
                block.length
            );
        }

        if (!block.argument) {
            code.index -= 2;
            throw code.makeError('Missing <arg>.');
        }

        return block;
    }

    return null;
}

function BARS_OPEN_PARTIAL(mode, code, tokens, close) {
    var index = code.index,
        length = code.length,
        block;
    if ( /* {{> */
        code.codePointAt(index)   === 0x007b &&
        code.codePointAt(++index) === 0x007b &&
        code.codePointAt(++index) === 0x003e
    ) {
        block = new Token(code, TYPES.BARS_PARTIAL);
        block.name = '';
        block.arguments = [];

        index++;

        if (!HTML_IDENTIFIER_START(code.codePointAt(index))) {
            code.index = index;
            throw code.makeError(
                'Unexpected Token: Expected <[A-Za-z]> but found ' +
                JSON.stringify(code.charAt(index)) +
                '.'
            );
        }

        for (; index < length; index++) {
            ch = code.codePointAt(index);

            if (HTML_IDENTIFIER(ch)) {
                block.name += code.charAt(index);
            } else {
                break;
            }
        }

        code.index = index;

        parseTokens('LOGIC', code, block.arguments, block);

        block.argument = block.arguments[0];

        if (block.arguments.length > 1) {
            code.index = block.arguments[1].range[0];
            throw code.makeError(
                'Unexpected Token: ' +
                JSON.stringify(block.arguments[1].source(code)) + '.',
                block.arguments[1].length
            );
        }
        delete block.arguments;

        if (!block.closed) {
            throw code.makeError(
                'Unclosed Block: Expected ' +
                JSON.stringify('}}') +
                ' but found ' +
                JSON.stringify(code.charAt(code.index)) +
                '.',
                block.length
            );
        }

        // if (!block.argument) {
        //     code.index -= 2;
        //     throw code.makeError('Missing <arg>.');
        // }

        return block;
    }

    return null;
}

function BARS_LOGIC_END(mode, code, tokens, close) {
    if ( /* }} */
        code.codePointAt(code.index) === 0x007d &&
        code.codePointAt(code.index + 1) === 0x007d
    ) {
        code.index += 2;
        close.close(code);
        return true;
    }

    return null;
}

function STRING(mode, code, tokens, close) {
    var ch,
        index = code.index,
        length = code.length,
        text;

        /* ' */
    if (code.codePointAt(index) !== 0x0027) {
        return null;
    }

    index++;

    text = new Token(code, TYPES.STRING);
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
        text.close(code);

        if (
            close &&
            (
                close.type === TYPES.UNARY_EXPRESSION ||
                close.type === TYPES.BINARY_EXPRESSION
            )
        ) {
            close.close(code);
        }

        return text;
    }

    return null;
}

function NUMBER(mode, code, tokens, close) {
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

        number = new Token(code, TYPES.NUMBER);

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
        number.close(code);
        number.value = Number(number.source(code));

        if (
            close &&
            (
                close.type === TYPES.UNARY_EXPRESSION ||
                close.type === TYPES.BINARY_EXPRESSION
            )
        ) {
            close.close(code);
        }

        return number;
    }

    return null;
}

function BOOLEAN(mode, code, tokens, close) {
    var index = code.index,
        bool = new Token(code, TYPES.BOOLEAN);

    if ( /* true */
        code.codePointAt(index)   === 0x0074 &&
        code.codePointAt(++index) === 0x0072 &&
        code.codePointAt(++index) === 0x0075 &&
        code.codePointAt(++index) === 0x0065
    ) {
        bool.value = true;
    } else if ( /* false */
        code.codePointAt(index)   === 0x0066 &&
        code.codePointAt(++index) === 0x0061 &&
        code.codePointAt(++index) === 0x006c &&
        code.codePointAt(++index) === 0x0073 &&
        code.codePointAt(++index) === 0x0065
    ) {
        bool.value = false;
    } else {
        return null;
    }

    index++;
    code.index = index;
    bool.close(code);

    if (
        close &&
        (
            close.type === TYPES.UNARY_EXPRESSION ||
            close.type === TYPES.BINARY_EXPRESSION
        )
    ) {
        close.close(code);
    }

    return bool;
}

function NULL(mode, code, tokens, close) {
    var index = code.index,
        nul = new Token(code, TYPES.NULL);

    if ( /* true */
        code.codePointAt(index)   === 0x006e &&
        code.codePointAt(++index) === 0x0075 &&
        code.codePointAt(++index) === 0x006c &&
        code.codePointAt(++index) === 0x006c
    ) {
        nul.value = null;
    } else {
        return null;
    }

    index++;
    code.index = index;
    nul.close(code);

    if (
        close &&
        (
            close.type === TYPES.UNARY_EXPRESSION ||
            close.type === TYPES.BINARY_EXPRESSION
        )
    ) {
        close.close(code);
    }

    return nul;
}

function INSERT_VAL(mode, code, tokens, close) {
    var index = code.index,
        length = code.length,
        ch = code.codePointAt(index),
        nextCh,
        value,
        style,
        name = ch === 0x007e, /* ~ */
        at,
        dot,
        devider,
        dotdot;

    if (
        !HTML_IDENTIFIER_START(ch) &&
        ch !== 0x007e && /* ~ */
        ch !== 0x002e && /* . */
        ch !== 0x0040    /* @ */
    ) {
        return null;
    }

    value = new Token(code, TYPES.INSERT_VAL);

    if (name) {
        index++;
    }

    for (; index < length; index++) {
        ch = code.codePointAt(index);
        nextCh = code.codePointAt(index + 1);

        if (HTML_IDENTIFIER(ch)) {
            if (dot || dotdot) {
                code.index = index;
                throw code.makeError(
                    'Unexpected Token: ' +
                    JSON.stringify(code.charAt(index)) +
                    '.'
                );
            }
            if (devider && !HTML_IDENTIFIER_START(ch)) {
                code.index = index;
                throw code.makeError(
                    'Unexpected Token: Expected <[A-Za-z]> but found ' +
                    JSON.stringify(code.charAt(index)) +
                    '.'
                );
            }
            name = true;
            devider = false;
            continue;
        } else if (!at && ch === 0x002f) { /* / */
            if (dot || style === 0 || devider) {
                code.index = index;
                throw code.makeError(
                    'Unexpected Token: ' +
                    JSON.stringify(code.charAt(index)) +
                    '.'
                );
            }
            style = 1;
            dotdot = false;
            devider = true;
        } else if (!at && !name && ch === 0x002e && nextCh === 0x002e) { /* .. */
            index++;
            if (dot || style === 0) {
                code.index = index;
                throw code.makeError(
                    'Unexpected Token: ' +
                    JSON.stringify(code.charAt(index)) +
                    '.'
                );
            }
            style = 1;
            dotdot = true;
            devider = false;
        } else if (!at && ch === 0x002e) { /* . */
            if (style === 1 || devider) {
                code.index = index;
                throw code.makeError(
                    'Unexpected Token: ' +
                    JSON.stringify(code.charAt(index)) +
                    '.'
                );
            }
            style = 0;
            devider = true;
            if (!name) {
                dot = true;
            }
        } else if (ch === 0x0040) { /* @ */
            if (at || dot || (style = 0 && devider)) {
                code.index = index;
                throw code.makeError(
                    'Unexpected Token: ' +
                    JSON.stringify(code.charAt(index)) +
                    '.'
                );
            }
            at = true;
        } else {
            break;
        }
    }

    if (index > code.index) {
        code.index = index;
        value.close(code);
        value.path = value.source(code);

        if (
            close &&
            (
                close.type === TYPES.UNARY_EXPRESSION ||
                close.type === TYPES.BINARY_EXPRESSION
            )
        ) {
            close.close(code);
        }

        return value;
    }

    return null;
}

function EXPRESSION(mode, code, tokens, close) {
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

        if (!WHITESPACE(ch)) break;

        if (ch === 0x000a) {
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
        (ch === 0x0021 && ch2 === 0x003d && ch3 === 0x003d)    /* !== */
    ) {
        code.index = index;
        expression = new Token(code, TYPES.BINARY_EXPRESSION);
        expression.opperator = code.slice(index, index + 3);
        index += 2;
    } else if ( /* handle BINARY-EXPRESSION */
        (ch === 0x003d && ch2 === 0x003d) || /* == */
        (ch === 0x0021 && ch2 === 0x003d) || /* != */
        (ch === 0x003c && ch2 === 0x003d) || /* <= */
        (ch === 0x003e && ch2 === 0x003d) || /* >= */
        (ch === 0x0026 && ch2 === 0x0026) || /* && */
        (ch === 0x007c && ch2 === 0x007c)    /* || */
    ) {
        code.index = index;
        expression = new Token(code, TYPES.BINARY_EXPRESSION);
        expression.opperator = code.slice(index, index + 2);
        index++;
    } else if ( /* handle BINARY-EXPRESSION */
        (ch === 0x002b) || /* + */
        (ch === 0x002d) || /* - */
        (ch === 0x002a) || /* * */
        (ch === 0x002f) || /* / */
        (ch === 0x0025) || /* % */
        (ch === 0x003c) || /* < */
        (ch === 0x003e)    /* > */
    ) {
        code.index = index;
        expression = new Token(code, TYPES.BINARY_EXPRESSION);
        expression.opperator = code.charAt(index);
    } else if ( /* handle UNARY-EXPRESSION */
        ch === 0x0021 /* ! */
    ) {
        code.index = index;
        expression = new Token(code, TYPES.UNARY_EXPRESSION);
        expression.opperator = code.charAt(index);
        index++;
    }

    if (!expression || !expression.opperator) {
        if (binary_fail) {
            return null;
        }
        code.index = index;
        return true;
    }

    if (expression.type === TYPES.BINARY_EXPRESSION) {
        if (binary_fail) {
            code.index = originalIndex;
            throw code.makeError(
                'Unexpected Token: ' +
                JSON.stringify(expression.opperator) +
                ' missing whitespace before opperator.',
                expression.opperator.length
            );
        }
        expression.left = tokens.pop();

        if (!expression.left) {
            code.index = index;
            throw code.makeError(
                'Missing left-hand <arg>.',
                expression.opperator.length
            );
        }

        if (
            expression.left.type !== TYPES.STRING &&
            expression.left.type !== TYPES.NUMBER &&
            expression.left.type !== TYPES.BOOLEAN &&
            expression.left.type !== TYPES.INSERT_VAL &&
            expression.left.type !== TYPES.UNARY_EXPRESSION &&
            expression.left.type !== TYPES.BINARY_EXPRESSION &&
            expression.left.type !== TYPES.TRANSFORM
        ) {
            code.index = expression.left.range[0];
            throw code.makeError(
                'Unexpected left-hand <arg>: ' +
                JSON.stringify(expression.left.source(code)) +
                '.',
                expression.left.length
            );
        }

        expression.range[0] = expression.left.range[0];
        expression.loc.start = expression.left.loc.start;

        index++;
        oldIndex = index;
        ch = code.codePointAt(index);
        for (; index < length; index++) {
            ch = code.codePointAt(index);

            if (!WHITESPACE(ch)) break;

            if (ch === 0x000a) {
                code.index = index;
                return null;
            }
        }
        if (index === oldIndex) {
            code.index = index;
            throw code.makeError(
                'Unexpected Token: Expected <whitespace> but found ' +
                JSON.stringify(code.charAt(index)) +
                '.'
            );
        }
    }

    expression.arguments = [];
    code.index = index;
    parseTokens('LOGIC', code, expression.arguments, expression);

    expression.right = expression.arguments[0];

    if (expression.arguments.length > 1) {
        code.index = expression.arguments[1].range[0];
        throw code.makeError(
            'Unexpected Token: ' +
            JSON.stringify(expression.arguments[1].source(code)) + '.',
            expression.arguments[1].length
        );
    }
    delete expression.arguments;

    if (!expression.closed || !expression.right) {
        code.index = index;
        throw code.makeError(
            'Missing right-hand <arg>.',
            expression.opperator.length
        );
    }

    if (
        expression.right.type !== TYPES.STRING &&
        expression.right.type !== TYPES.NUMBER &&
        expression.right.type !== TYPES.BOOLEAN &&
        expression.right.type !== TYPES.INSERT_VAL &&
        expression.right.type !== TYPES.UNARY_EXPRESSION &&
        expression.right.type !== TYPES.TRANSFORM

    ) {
        code.index = expression.right.range[0];
        throw code.makeError(
            'Unexpected right-hand <arg>: ' +
            JSON.stringify(expression.right.source(code)) +
            '.',
            expression.right.length
        );
    }

    if (expression.type === TYPES.UNARY_EXPRESSION) {
        expression.argument = expression.right;
        delete expression.right;

        if (
            close &&
            (
                close.type === TYPES.UNARY_EXPRESSION ||
                close.type === TYPES.BINARY_EXPRESSION
            )
        ) {
            close.close(code);
        }
    }

    return expression;
}

function TRANSFORM_END(mode, code, tokens, close) {
    if ( /* ) */
        code.codePointAt(code.index) === 0x0029
    ) {
        code.index++;
        close.close(code);
        return true;
    }

    if ( /* , */
        code.codePointAt(code.index) === 0x002c
    ) {
        code.index++;
        close.close(code);
        close.nextArg = true;
        return true;
    }

    return null;
}

function TRANSFORM(mode, code, tokens, close) {
    var index = code.index,
        length = code.length,
        transform,
        ch = code.codePointAt(index);

    if (ch !== 0x0040) { /* @ */
        return null;
    }

    transform = new Token(code, TYPES.TRANSFORM);

    transform.name = '';
    transform.arguments = [];

    index++;

    if (!HTML_IDENTIFIER_START(code.codePointAt(index))) {
        code.index = index;
        throw code.makeError(
            'Unexpected Token: Expected <[A-Za-z]> but found ' +
            JSON.stringify(code.charAt(index)) +
            '.'
        );
    }

    for (; index < length; index++) {
        ch = code.codePointAt(index);

        if (HTML_IDENTIFIER(ch)) {
            transform.name += code.charAt(index);
        } else {
            break;
        }
    }

    ch = code.codePointAt(index);
    if (ch === 0x0028) { /* ( */
        index++;
        code.index = index;
        while (code.left) {
            var args = [];
            parseTokens('LOGIC-ARGS', code, args, transform);

            if (args.length > 1) {
                code.index = args[1].range[0];
                throw code.makeError(
                    'Unexpected Token: ' +
                    JSON.stringify(args[1].source(code)) + '.',
                    args[1].length
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
        close &&
        (
            close.type === TYPES.UNARY_EXPRESSION ||
            close.type === TYPES.BINARY_EXPRESSION
        )
    ) {
        close.close(code);
    }

    return transform;
}

/* Parse Modes */

var parseTokenFuncs = {
    'TEXT': [
        TEXT,
        BARS_CODE_COMMENT,
        BARS_COMMENT,
        BARS_CLOSE_BLOCK,
        BARS_ELSE_BLOCK,
        BARS_OPEN_BLOCK,
        BARS_OPEN_PARTIAL,
        BARS_OPEN_INSERT
    ],
    'DOM': [
        HTML_COMMENT,
        HTML_CLOSE_TAG,
        HTML_OPEN_TAG,
        BARS_CODE_COMMENT,
        BARS_COMMENT,
        BARS_CLOSE_BLOCK,
        BARS_ELSE_BLOCK,
        BARS_OPEN_BLOCK,
        BARS_OPEN_PARTIAL,
        BARS_OPEN_INSERT,
        HTML_TEXT
    ],
    'ATTR': [
        HTML_OPEN_TAG_END,
        BARS_CODE_COMMENT,
        BARS_COMMENT,
        BARS_CLOSE_BLOCK,
        BARS_ELSE_BLOCK,
        BARS_OPEN_BLOCK,
        WHITE_SPACE,
        HTML_ATTR,
    ],
    'VALUE': [
        STRING_END,
        BARS_CODE_COMMENT,
        BARS_COMMENT,
        BARS_CLOSE_BLOCK,
        BARS_ELSE_BLOCK,
        BARS_OPEN_BLOCK,
        BARS_OPEN_INSERT,
        STRING_TEXT
    ],
    'LOGIC': [
        BARS_LOGIC_END,
        STRING,
        NUMBER,
        BOOLEAN,
        NULL,
        TRANSFORM,
        INSERT_VAL,
        EXPRESSION,
        // WHITE_SPACE
    ],
    'LOGIC-ARGS': [
        TRANSFORM_END,
        STRING,
        NUMBER,
        BOOLEAN,
        NULL,
        TRANSFORM,
        INSERT_VAL,
        EXPRESSION,
        // WHITE_SPACE
    ]
};

function repeat(a, b) {
    var c = '';
    for (var i = 0; i < b; i++) {
        c+=a;
    }
    return c;
}
function parseTokens(mode, code, tokens, close) {
    var token,
        index = code.index;

    parseTokens.level++;

    loop: while (code.left) {

        for (var i = 0; i < parseTokenFuncs[mode].length; i++) {
            // console.log(
            //     repeat(' ', parseTokens.level) + mode.green + ' '+
            //     parseTokenFuncs[mode][i].name + '\n' +
            //     repeat(' ', parseTokens.level + 1) + bufferSlice(code, 5)
            // );

            token = parseTokenFuncs[mode][i](mode, code, tokens, close);

            if (token) {
                if (token instanceof Token) {
                    tokens.push(token);
                }
                if (close && close.closed) {
                    break loop;
                }
                break;
            }
        }

        if (index === code.index) {
            token = new Token(code, 'ILLEGAL');
            token.close(code);
            token.value = token.source(code);
            code.index = token.range[0];
            throw code.makeError(
                'ILLEGAL Token: ' +
                JSON.stringify(token.source(code))
            );
            // tokens.push(token);
        }

        index = code.index;
    }

    // if (close && !close.closed) {
    //     throw code.makeError(
    //         'Unexpected End Of Input.'
    //     );
    // }

    parseTokens.level--;
}
parseTokens.level = -1;

function compile (str, file, mode) {
    var code = new CodeBuffer(str, file),
        frag = new Token(code, TYPES.FRAGMENT);
        frag.nodes = [];

    parseTokens(mode || 'DOM', code, frag.nodes);

    frag.close(code);

    return frag;
}

module.exports = compile;

},{"./code-buffer":4,"./html-entities":6,"./self-closing-tags":8,"./token":10,"./token-types":9}],6:[function(require,module,exports){
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

},{}],7:[function(require,module,exports){
module.exports = require('./compiler');

},{"./compiler":5}],8:[function(require,module,exports){
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

},{}],9:[function(require,module,exports){
module.exports={
    "TEXT":              "TEXT",
    "FRAGMENT":          "FRAGMENT",
    "HTML_COMMENT":      "HTML-COMMENT",
    "HTML_TAG":          "HTML-TAG",
    "HTML_TEXT":         "HTML-TEXT",
    "HTML_ATTR":         "HTML-ATTR",
    "STRING_TEXT":       "STRING-TEXT",
    "BARS_COMMENT":      "BARS-COMMENT",
    "BARS_BLOCK":        "BARS-BLOCK",
    "BARS_ELSE":         "BARS-ELSE",
    "BARS_INSERT":       "BARS-INSERT",
    "BARS_PARTIAL":      "BARS-PARTIAL",
    "STRING":            "STRING",
    "NUMBER":            "NUMBER",
    "BOOLEAN":           "BOOLEAN",
    "NULL":              "NULL",
    "INSERT_VAL":        "INSERT-VAL",
    "UNARY_EXPRESSION":  "UNARY-EXPRESSION",
    "BINARY_EXPRESSION": "BINARY-EXPRESSION",
    "TRANSFORM":         "TRANSFORM"
}

},{}],10:[function(require,module,exports){

function Token(code, type) {

    this.type = type;
    this.range = [code.index, code.index + 1];
    this.loc = {
        start: {
            line: code.line,
            column: code.column
        },
        end: {
            line: code.line,
            column: code.column + 1
        }
    };
    // console.log('TOKEN: '+this.type.red+' `' + this.source(code).green.underline+'` at ' + this.loc.start.line+ ':' + this.loc.start.column);
}

Token.prototype = {
    get length() {
        return this.range[1] - this.range[0];
    },
    source: function source(code) {
        return code.slice(this.range[0], this.range[1]);
    },
    close: function close(code) {
        this.closed = true;

        if (code.index > this.range[1]) {
            this.range[1] = code.index;
            // this.value = code.slice(this.range[0], this.range[1]);
            this.loc.end = {
                line: code.line,
                column: code.column
            };
        }

        // console.log('TOKEN: '+this.type.red+' `' + this.source(code).green.underline+'` at ' + this.loc.start.line+ ':' + this.loc.start.column);
    },
    // toJSON: function toJSON() {
    //     return {
    //         type: this.type,
    //         value: this.value,
    //         range: this.range,
    //         loc: this.loc,
    //     };
    // },
    toJSON: function toJSON() {
        delete this.range;
        delete this.loc;
        delete this.closed;
        return this;
    }
};

module.exports = Token;

},{}],11:[function(require,module,exports){
var Generator = require('generate-js'),
    execute = require('./runtime/execute'),
    Context = require('./runtime/context'),
    Nodes = {},
    ARRAY = [],
    MAP = {
        'FRAGMENT': 'FRAG',
        'HTML-TAG': 'TAG',
        'HTML-TEXT': 'TEXT',
        'HTML-ATTR': 'ATTR',
        'STRING-TEXT': 'TEXT',
        'BARS-BLOCK': 'BLOCK',
        'BARS-INSERT': 'TEXT',
        'BARS-PARTIAL': 'PARTIAL'
    };

/**
 * [BarsNode description]
 * @param {[type]} bars     [description]
 * @param {[type]} struct   [description]
 */
var BarsNode = Generator.generate(function BarsNode(bars, struct) {
    var _ = this;

    _.defineProperties({
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
        arg: struct.argument,
        conFrag: struct.consequent,
        altFrag: struct.alternate,
    });
});

BarsNode.definePrototype({
    update: function update(context) {
        var _ = this;

        _.previousDom = null;

        if (!Context.isCreation(context)) {
            context = new Context(context);
        }

        if (_.path) {
            context = context.newContext(context.lookup(_.path), {
                key: _.path,
                index: _.path
            });
        }

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
Nodes.TEXT = BarsNode.generate(function TextNode(bars, struct) {
    var _ = this;

    _.supercreate(bars, struct);

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
Nodes.TAG = BarsNode.generate(function TagNode(bars, struct) {
    var _ = this,
        nodes = struct.nodes || ARRAY,
        attrs = struct.attrs || ARRAY,
        i;

    _.supercreate(bars, struct);

    _.defineProperties({
        $el: document.createElement(struct.name),
        attrs: []
    });

    for (i = 0; i < nodes.length; i++) {
        var node = nodes[i];
        _.appendChild(Nodes[MAP[node.type]].create(bars, node));
    }

    for (i = 0; i < attrs.length; i++) {
        var attr = attrs[i];
        _.addAttr(Nodes[MAP[attr.type]].create(bars, attr));
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
 * [HTMLNode description]
 * @param {[type]} bars    [description]
 * @param {[type]} struct  [description]
 */
Nodes.HTML = BarsNode.generate(function HTMLNode(bars, struct) {
    var _ = this;

    _.supercreate(bars, struct);

    _.defineProperties({
        $el: document.createElement('div'),
    });
});

Nodes.HTML.definePrototype({
    isDOM: true,

    _update: function _update(context) {
        var _ = this,
            $parent = _.parentTag.$el || _.parentTag.$parent;

        $parent.innerHTML = context(_.path);
    },

    _elementAppendTo: function _elementAppendTo() {},
    _elementRemove: function _elementRemove() {
        var _ = this,
            $parent = _.parentTag.$el || _.parentTag.$parent;

        while ($parent.firstChild) {
            $parent.removeChild($parent.firstChild);
        }
    }
});


/**
 * [AttrNode description]
 * @param {[type]} bars    [description]
 * @param {[type]} struct  [description]
 */
Nodes.ATTR = BarsNode.generate(function AttrNode(bars, struct) {
    var _ = this,
        nodes = struct.nodes || ARRAY;

    _.supercreate(bars, struct);

    _.defineProperties({
        $el: document.createElement('div'),
    });

    for (var i = 0; i < nodes.length; i++) {
        var node = nodes[i];
        _.appendChild(Nodes[MAP[node.type]].create(bars, node));
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
Nodes.BLOCK = BarsNode.generate(function BlockNode(bars, struct) {
    var _ = this;

    _.supercreate(bars, struct);
});

Nodes.BLOCK.definePrototype({
    type: 'BLOCK',

    createFragment: function createFragment(path) {
        var _ = this,
            frag = Nodes.FRAG.create(_.bars, _.conFrag);

        frag.path = path;

        _.appendChild(frag);
    },

    _update: function _update(context) {
        var _ = this,
            con,
            arg,
            i;

        if (typeof _.bars.blocks[_.name] === 'function') {
            arg = execute(_.arg, _.bars.transforms, context);
            _.context = context;
            // console.log('>>>>', arg);
            con = _.bars.blocks[_.name].call(_, arg);
        } else {
            throw new Error('Block helper not found: ' + _.name);
        }

        if (con) {
            if (!_.nodes.length) {
                _.createFragment();
            }

            for (i = 0; i < _.nodes.length; i++) {
                _.nodes[i].update(_.context);
            }

            if (_.alternate) {
                _.alternate._elementRemove();
            }
        } else {
            for (i = 0; i < _.nodes.length; i++) {
                _.nodes[i]._elementRemove();
            }

            if (!_.alternate) {
                _.alternate = Nodes.FRAG.create(_.bars, _.altFrag ||
                    {});
                _.alternate.parent = _;
            }

            _.alternate.update(_.context);
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
Nodes.PARTIAL = BarsNode.generate(function PartialNode(bars, struct) {
    var _ = this;

    _.supercreate(bars, struct);
});

Nodes.PARTIAL.definePrototype({
    _update: function _update(context) {
        var _ = this;

        if (!_.partial) {
            var partial = _.bars.partials[_.name];

            if (partial && typeof partial === 'object') {
                _.partial = Nodes.FRAG.create(_.bars, partial.struct);
                _.partial.parent = _;
            } else {
                throw new Error('Partial not found: ' + _.name);
            }
        }

        // context = context.getContext('');
        //
        // var newData = {},
        //     path;
        //
        // for (var key in _.arg) {
        //     path = _.arg[key];
        //
        //     if (!path) continue;
        //     if (path[0] !== '/') path = parentPath(_) + '/' + path;
        //
        //     newData[key] = context(path);
        // }
        //
        // _.partial.update(newData);

        _.partial.update(execute(_.arg, _.bars.transforms, context));
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
Nodes.FRAG = BarsNode.generate(function FragNode(bars, struct) {
    // console.log('>>>>>', struct);
    var _ = this,
        nodes = struct.nodes || ARRAY;

    _.supercreate(bars, struct);

    for (var i = 0; i < nodes.length; i++) {
        var node = nodes[i];
        if (MAP[node.type])
            _.appendChild(Nodes[MAP[node.type]].create(bars, node));
    }
});

Nodes.FRAG.definePrototype({
    _update: function _update(context) {
        var _ = this;

        for (var i = 0; i < _.nodes.length; i++) {
            _.nodes[i].update(context);
        }
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

},{"./runtime/context":14,"./runtime/execute":15,"generate-js":18}],12:[function(require,module,exports){
module.exports = require('./bars');

},{"./bars":2}],13:[function(require,module,exports){
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
        return Frag.create(_.bars, _.struct);
    },
});

module.exports = Renderer;

},{"./frag":11,"generate-js":18}],14:[function(require,module,exports){
var Generator = require('generate-js');

var Context_ = Generator.generate(function Context(data, parentContext,
    barsProps) {
    var _ = this;

    _.data = data;
    _.barsProps = barsProps || {};
    _.parentContext = Context_.isCreation(parentContext) ?
        parentContext : null;
});

Context_.definePrototype({
    lookup: function lookup(path) {
        var _ = this,
            splitPath;

        if (path instanceof Array) {
            splitPath = path;
        } else if (typeof path === 'string') {
            if (path.match(/[/]/)) {
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

        if (splitPath[0] === '~' && _.parentContext) {
            return _.parentContext.lookup(splitPath);
        }

        if (splitPath[0] === '..' && _.parentContext) {
            splitPath.shift();
            return _.parentContext.lookup(splitPath);
        }

        if (
            splitPath[0] === 'this' ||
            splitPath[0] === '.' ||
            splitPath[0] === '~' ||
            splitPath[0] === '..'
        ) {
            splitPath.shift();
        }

        var value = _.data;

        for (var i = 0; value && i < splitPath.length; i++) {

            if (splitPath[i][0] === '@') {
                value = _.barsProps[splitPath[i].slice(1)];
            } else if (value !== null && value !== void(0)) {
                value = value[splitPath[i]];
            } else {
                value = undefined;
            }
        }

        return value;
    },

    newContext: function newContext(obj, barsProps) {
        var _ = this;

        return new Context_(obj, _, barsProps);
    }
});

module.exports = Context_;

},{"generate-js":18}],15:[function(require,module,exports){
var TYPES = require('../compiler/token-types');
var logic = require('./logic');

function execute(syntaxTree, transforms, context) {
    function run(token) {
        var result,
            args =  [];

        if (
            token.type === TYPES.STRING ||
            token.type === TYPES.NUMBER ||
            token.type === TYPES.BOOLEAN ||
            token.type === TYPES.NULL
        ) {
            result = token.value;
        } else if (
            token.type === TYPES.INSERT_VAL
        ) {
            result = context.lookup(token.path);
        } else if (
            token.type === TYPES.UNARY_EXPRESSION
        ) {
            result = logic[token.opperator](
                run(token.argument)
            );
        } else if (
            token.type === TYPES.BINARY_EXPRESSION
        ) {
            if (token.opperator === '||') {
                result = run(token.left) || run(token.right);
            } else if (token.opperator === '&&') {
                result = run(token.left) && run(token.right);
            } else {
                result = logic[token.opperator](
                    run(token.left),
                    run(token.right)
                );
            }
        } else if (
            token.type === TYPES.TRANSFORM
        ) {
            for (var i = 0; i < token.arguments.length; i++) {
                args.push(run(token.arguments[i]));
            }
            if (transforms[token.name] instanceof Function) {
                result = transforms[token.name].apply(null, args);
            } else {
                throw 'Missing Transfrom: "' + token.name +'".';
            }
        }

        return result;
    }

    if (syntaxTree) {
        return run(syntaxTree);
    } else {
        return context.lookup('.');
    }
}

module.exports = execute;

},{"../compiler/token-types":9,"./logic":16}],16:[function(require,module,exports){
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

},{}],17:[function(require,module,exports){
var Generator = require('generate-js');

var Transfrom = Generator.generate(function Transfrom() {});

Transfrom.definePrototype({
    upperCase: function upperCase(a) {
        return String(a).toUpperCase();
    },
    lowerCase: function lowerCase(a) {
        return String(a).toLowerCase();
    },
    number: function number(a) {
        return Number(a);
    },
    string: function string(a) {
        return String(a);
    },
    sort: function sort(arr, key) {
        return arr.sort(function (a, b) {
            if (key) {
                if (a[key] < b[key]) return -1;
                if (a[key] > b[key]) return  1;
                return 0;
            }

            if (a < b) return -1;
            if (a > b) return  1;
            return 0;
        });
    }
});

module.exports = Transfrom;

},{"generate-js":18}],18:[function(require,module,exports){
/**
 * @name generate.js
 * @author Michaelangelo Jong
 */

(function GeneratorScope() {

    function Generator() {}

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

    function makeSupercreate(_super) {
        function supercreate() {
            this.supercreate = _super.supercreate;
            _super.apply(this, arguments);
        }

        return supercreate;
    }

    function makeCreate() {
        function create() {
            var _ = this;

            function GeneratorFF(args) {
                this.supercreate = _.supercreate;

                _.apply(this, args);

                delete this.supercreate;
            }

            defineObjectProperties(
                GeneratorFF, {
                    configurable: false,
                    enumerable: false,
                    writable: false
                }, {
                    prototype: _.prototype
                }
            );

            return new GeneratorFF(arguments);
        }

        return create;
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
        }, {
            /**
             * Returns true if 'generator' was generated by this Generator.
             * @param  {Generator} generator A Generator.
             * @return {Boolean}             true or false.
             */
            isGenerator: function isGenerator(generator) {
                return Generation.isGeneration(generator);
            },

            /**
             * [toGenerator description]
             * @param  {Function} constructor A constructor function.
             * @return {Generator}            A new generator who's create method is `constructor` and inherits from `constructor.prototype`.
             */
            toGenerator: function toGenerator(constructor) {
                assertTypeError(constructor, 'function');

                function newGenerator() {
                    constructor.apply(this, arguments);
                }

                Extend(newGenerator);

                defineObjectProperties(
                    newGenerator, {
                        configurable: false,
                        enumerable: false,
                        writable: false
                    }, {
                        /**
                         * Creates a new instance of this Generator.
                         * @return {Generator} Instance of this Generator.
                         */
                        prototype: Object.create(constructor.prototype),
                        create: makeCreate(),
                        supercreate: makeSupercreate(
                            constructor)
                    }
                );

                defineObjectProperties(
                    newGenerator.prototype, {
                        configurable: false,
                        enumerable: false,
                        writable: false
                    },
                    Creation
                );

                defineObjectProperties(
                    newGenerator.prototype, {
                        configurable: false,
                        enumerable: false,
                        writable: false
                    }, {
                        /**
                         * Creates a new instance of this Generator.
                         * @return {Generator} Instance of this Generator.
                         */
                        constructor: newGenerator
                    }
                );

                return newGenerator;
            }
        }
    );

    function Extend(generator) {
        defineObjectProperties(
            generator, {
                configurable: false,
                enumerable: false,
                writable: false
            }, {
                /**
                 * Generates a new generator that inherits from `this` generator.
                 * @param {Generator} ParentGenerator Generator to inherit from.
                 * @param {Function} create           Create method that gets called when creating a new instance of new generator.
                 * @return {Generator}                New Generator that inherits from 'ParentGenerator'.
                 */
                generate: function generate(create) {
                    var _ = this;
                    assertError(_.prototype.defineProperties ===
                        Creation.defineProperties,
                        'Cannot call method \'generate\' on non-Generations.'
                    );
                    assertTypeError(create, 'function');


                    Extend(create);

                    defineObjectProperties(
                        create, {
                            configurable: false,
                            enumerable: false,
                            writable: false
                        }, {
                            /**
                             * Creates a new instance of this Generator.
                             * @return {Generator} Instance of this Generator.
                             */
                            prototype: Object.create(_.prototype),
                            create: makeCreate(),
                            supercreate: makeSupercreate(_)
                        }
                    );

                    defineObjectProperties(
                        create.prototype, {
                            configurable: false,
                            enumerable: false,
                            writable: false
                        }, {
                            /**
                             * Creates a new instance of this Generator.
                             * @return {Generator} Instance of this Generator.
                             */
                            constructor: create
                        }
                    );

                    return create;
                },

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
                 * Defines shared properties for all objects created by this generator.
                 * @param  {Object} descriptor Optional object descriptor that will be applied to all attaching properties.
                 * @param  {Object} properties An object who's properties will be attached to this generator's prototype.
                 * @return {Generator}         This generator.
                 */
                definePrototype: function definePrototype(descriptor,
                    properties) {
                    defineObjectProperties(this.proto, descriptor,
                        properties);
                    return this;
                },

                /**
                 * Generator.toString method.
                 * @return {String} A string representation of this generator.
                 */
                toString: function toString() {
                    return '[' + (this.name || 'generation') +
                        ' Generator]';
                }
            }
        );
    }

    Extend(Generator);

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
        window.GeneratorF = Generator;
    }

}());

},{}]},{},[1]);
