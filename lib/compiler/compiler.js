var CodeBuffer = require('./code-buffer'),
    Token = require('./token');

function bufferSlice(code, range) {
    return JSON.stringify(
            code.slice(Math.max(0, code.index - range), code.index)
        )
        .slice(1, -1) +
        JSON.stringify(code.charAt(code.index) || 'EOF')
        .slice(1, -1)
        .green.underline +
        JSON.stringify(
            code.slice(
                code.index + 1,
                Math.min(code.length, code.index + 1 + range)
            )
        )
        .slice(1, -1);
}


var SELF_CLOSEING_TAGS = require('./self-closing-tags');
var ENTITIES = require('./html-entities');
var TYPES = require('./token-types');

function HTML_IDENTIFIER_START(ch) {
    return (0x0041 <= ch && ch <= 0x005a) ||
        (0x0061 <= ch && ch <= 0x007a);
}

function HTML_ENTITY(ch) {
    /* ^[0-9A-Za-z]$ */
    return (0x0030 <= ch && ch <= 0x0039) ||
        (0x0041 <= ch && ch <= 0x005a) ||
        (0x0061 <= ch && ch <= 0x007a);
}

function HTML_IDENTIFIER(ch) {
    /* ^[0-9A-Z_a-z-]$ */
    return ch === 0x002d ||
        (0x0030 <= ch && ch <= 0x0039) ||
        (0x0041 <= ch && ch <= 0x005a) ||
        ch === 0x005f ||
        (0x0061 <= ch && ch <= 0x007a);
}

function WHITESPACE(ch) {
    /* ^\s$ */
    return (0x0009 <= ch && ch <= 0x000d) ||
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
        code = parseInt(str.slice(2, -1), 0x000a);
    }

    if (typeof code === 'number' && !isNaN(code)) {
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
            code.codePointAt(index) === 0x007b /* { */ &&
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
        code.codePointAt(index) === 0x003c &&
        code.codePointAt(++index) === 0x0021 &&
        code.codePointAt(++index) === 0x002d &&
        code.codePointAt(++index) === 0x002d
    ) {
        comment = new Token(code, TYPES.HTML_COMMENT);
        index++;

        for (; index < length; index++) {
            if ( /* --> */
                code.codePointAt(index) === 0x002d &&
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
        code.codePointAt(index) === 0x003c &&
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

        if (ch === 0x0026 /* & */ ) {
            isEntity = true;
            entityStr = code.charAt(index);

            continue;
        } else if (isEntity && ch === 0x003b /* ; */ ) {
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
    if (code.codePointAt(code.index) === 0x0022 /* " */ ) {
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
        code.codePointAt(index) === 0x007b &&
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
        code.codePointAt(index) === 0x007b &&
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
                code.codePointAt(index) === 0x002d &&
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
        code.codePointAt(index) === 0x007b &&
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
                index += 2;
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
        code.codePointAt(index) === 0x007b &&
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
        code.codePointAt(index) === 0x007b &&
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
        code.codePointAt(index) === 0x007b &&
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
        code.codePointAt(index) === 0x007b &&
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
        code.codePointAt(index) === 0x0074 &&
        code.codePointAt(++index) === 0x0072 &&
        code.codePointAt(++index) === 0x0075 &&
        code.codePointAt(++index) === 0x0065
    ) {
        bool.value = true;
    } else if ( /* false */
        code.codePointAt(index) === 0x0066 &&
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
        code.codePointAt(index) === 0x006e &&
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
        name = ch === 0x007e,
        /* ~ */
        at,
        dot,
        devider,
        dotdot;

    if (!HTML_IDENTIFIER_START(ch) &&
        ch !== 0x007e && /* ~ */
        ch !== 0x002e && /* . */
        ch !== 0x0040 /* @ */
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
        (ch === 0x0021 && ch2 === 0x003d && ch3 === 0x003d) /* !== */
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
        (ch === 0x007c && ch2 === 0x007c) /* || */
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
        (ch === 0x003e) /* > */
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
        c += a;
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

function compile(str, file, mode) {
    var code = new CodeBuffer(str, file),
        frag = new Token(code, TYPES.FRAGMENT);
    frag.nodes = [];

    parseTokens(mode || 'DOM', code, frag.nodes);

    frag.close(code);

    return frag;
}

module.exports = compile;
