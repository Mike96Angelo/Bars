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


function HTML_IDENTIFIER(ch) {
    /* ^[_A-Za-z0-9-]$ */
    return (ch === 45) ||
           (48 <= ch && ch <= 57) ||
           (65 <= ch && ch <= 90) ||
           (ch === 95) ||
           (97 <= ch && ch <= 122);
}

function WHITESPACE(ch) {
    /* ^\s$ */
    return (9 <= ch && ch <= 13) ||
            ch === 32 ||
            ch === 160 ||
            ch === 5760 ||
            ch === 6158 ||
            ch === 8192 ||
            ch === 8193 ||
            ch === 8194 ||
            ch === 8195 ||
            ch === 8196 ||
            ch === 8197 ||
            ch === 8198 ||
            ch === 8199 ||
            ch === 8200 ||
            ch === 8201 ||
            ch === 8202 ||
            ch === 8232 ||
            ch === 8233 ||
            ch === 8239 ||
            ch === 8287 ||
            ch === 12288 ||
            ch === 65279;
}

function HTML_ENTITY(ch) {
    /* ^[A-Za-z0-9]$ */
    return (48 <= ch && ch <= 57) ||
           (65 <= ch && ch <= 90) ||
           (97 <= ch && ch <= 122);
}

function getHTMLUnEscape(str) {
    var code;

    code = ENTITIES[str.slice(1, -1)];

    if (typeof code !== 'number' && str[1] === '#') {
        code = parseInt( str.slice(2, -1), 10);
    }

    if (typeof code === 'number' && !isNaN(code)){
        return String.fromCharCode(code);
    }

    return str;
}

/////////
// DOM //
/////////

function HTML_COMMENT(mode, code, tokens, close) {
    var index = code.index,
        length = code.length,
        comment;

    if ( /* <!-- */
        code.codePointAt(index)   === 60 &&
        code.codePointAt(++index) === 33 &&
        code.codePointAt(++index) === 45 &&
        code.codePointAt(++index) === 45
    ) {
        comment = new Token(code, TYPES.HTML_COMMENT);
        index++;

        for (; index < length; index++) {
            if ( /* --> */
                code.codePointAt(index)     === 45 &&
                code.codePointAt(index + 1) === 45 &&
                code.codePointAt(index + 2) === 62
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
        code.codePointAt(index) === 60 &&
        code.codePointAt(++index) === 47
    ) {
        tag = new Token(code, TYPES.HTML_TAG);
        tag.name = '';

        index++;

        for (; index < length; index++) {
            ch = code.codePointAt(index);

            if (HTML_IDENTIFIER(ch)) {
                tag.name += code.charAt(index);
            } else if (ch === 62) { /* > */
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
        code.codePointAt(index) === 60
    ) {
        tag = new Token(code, TYPES.HTML_TAG);
        tag.name = '';
        tag.attrs = [];
        tag.nodes = [];

        index++;

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
            ch === 60 /* < */ ||
            ch === 123 /* { */ &&
            code.codePointAt(index + 1) === 123 /* { */
        ) {
            text.value += entityStr;
            break;
        }

        if (ch === 38 /* & */) {
            isEntity = true;
            entityStr = code.charAt(index);

            continue;
        } else if (isEntity && ch === 59 /* ; */) {
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
    if (ch === 62) {
        code.index++;
        close.close(code);
        return true;
    } else if ( /* /> */
        ch === 47 &&
        code.codePointAt(code.index + 1) === 62
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

    for (; index < length; index++) {

        if (!HTML_IDENTIFIER(code.codePointAt(index))) {
            break;
        }

        attr.name += code.charAt(index);
    }

    if (attr.name) {
        /* = */
        if (code.codePointAt(index) === 61) {
            index++;
            /* " */
            if (code.codePointAt(index) === 34) {
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
    if (code.codePointAt(code.index) === 34 /* " */) {
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

        if (ch === 10) {
            code.index = index;
            return null;
        }

        if ( /* " but not \" */
            ch === 34 &&
            code.codePointAt(index - 1) !== 92
        ) {
            break;
        }

        if ( /* {{ */
            ch === 123 &&
            code.codePointAt(index + 1) === 123
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
        code.codePointAt(index)   === 123 &&
        code.codePointAt(++index) === 123 &&
        code.codePointAt(++index) === 33
    ) {
        comment = new Token(code, TYPES.BARS_COMMENT);
        index++;

        for (; index < length; index++) {
            if ( /* }} */
                code.codePointAt(index) === 125 &&
                code.codePointAt(index + 1) === 125
            ) {
                index += 2;
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

function BARS_CLOSE_BLOCK(mode, code, tokens, close) {
    var index = code.index,
        length = code.length,
        block;

    if ( /* {{/ */
        code.codePointAt(index)   === 123 &&
        code.codePointAt(++index) === 123 &&
        code.codePointAt(++index) === 47
    ) {
        block = new Token(code, TYPES.BARS_BLOCK);
        block.name = '';

        index++;

        for (; index < length; index++) {
            ch = code.codePointAt(index);

            if (HTML_IDENTIFIER(ch)) {
                block.name += code.charAt(index);
            } else if ( /* }} */
                ch === 125 &&
                code.codePointAt(index + 1) === 125
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
        code.codePointAt(index)   === 123 &&
        code.codePointAt(++index) === 123 &&
        code.codePointAt(++index) === 101 &&
        code.codePointAt(++index) === 108 &&
        code.codePointAt(++index) === 115 &&
        code.codePointAt(++index) === 101 &&
        code.codePointAt(++index) === 125 &&
        code.codePointAt(++index) === 125
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
        code.codePointAt(index) === 123 &&
        code.codePointAt(++index) === 123 &&
        code.codePointAt(++index) === 35
    ) {
        block = new Token(code, TYPES.BARS_BLOCK);
        block.name = '';
        block.arguments = [];

        index++;

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
        code.codePointAt(index) === 123 &&
        code.codePointAt(++index) === 123
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
        code.codePointAt(index) === 123 &&
        code.codePointAt(++index) === 123 &&
        code.codePointAt(++index) === 62
    ) {
        block = new Token(code, TYPES.BARS_PARTIAL);
        block.name = '';
        block.arguments = [];

        index++;

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
        code.codePointAt(code.index) === 125 &&
        code.codePointAt(code.index + 1) === 125
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

    if (code.codePointAt(index) !== 39) {
        return null;
    }

    index++;

    text = new Token(code, TYPES.STRING);
    text.value = '';

    for (; index < length; index++) {
        ch = code.codePointAt(index);

        if (ch === 10) {
            code.index = index;
            return null;
        }

        if ( /* ' but not \' */
            ch === 39 &&
            code.codePointAt(index - 1) !== 92
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
        (ch === 45 && 48 <= nextCh && nextCh <= 57) || /* -[0-9] */
        (48 <= ch && ch <= 57) /* [0-9] */
    ) {
        index++;

        number = new Token(code, TYPES.NUMBER);

        for (; index < length; index++) {
            ch = code.codePointAt(index);

            if (48 <= ch && ch <= 57) {
                continue;
            } else if (ch === 69 || ch === 101) { /* [Ee] */
                index++;

                ch = code.codePointAt(index);
                nextCh = code.codePointAt(index + 1);

                if ( /* [+-]?[0-9] */
                    Ee ||
                    !(
                        (
                            (ch === 43 || ch === 45) &&
                            (48 <= nextCh && nextCh <= 57)
                        ) ||
                        (48 <= ch && ch <= 57)
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
            } else if (ch === 46) { /* . */
                index++;
                ch = code.codePointAt(index);
                if ( /* [+-]?[0-9] */
                    Ee ||
                    dot ||
                    !(48 <= ch && ch <= 57)
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
        number.value = Number.parseFloat(number.source(code));

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
        code.codePointAt(index)   === 116 &&
        code.codePointAt(++index) === 114 &&
        code.codePointAt(++index) === 117 &&
        code.codePointAt(++index) === 101
    ) {
        bool.value = true;
    } else if ( /* false */
        code.codePointAt(index)   === 102 &&
        code.codePointAt(++index) === 97 &&
        code.codePointAt(++index) === 108 &&
        code.codePointAt(++index) === 115 &&
        code.codePointAt(++index) === 101
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

function INSERT_VAL(mode, code, tokens, close) {
    var index = code.index,
        length = code.length,
        ch = code.codePointAt(index),
        nextCh,
        value = new Token(code, TYPES.INSERT_VAL),
        style,
        name = ch === 47,
        at,
        dot,
        devider;

    for (; index < length; index++) {
        ch = code.codePointAt(index);
        nextCh = code.codePointAt(index + 1);
        if (HTML_IDENTIFIER(ch)) {
            if (dot) {
                code.index = index;
                throw code.makeError(
                    'Unexpected Token: ' +
                    JSON.stringify(code.charAt(index)) +
                    '.'
                );
            }
            name = true;
            devider = false;
            continue;
        } else if (!at && ch === 47) { /* / */
            if (dot || style === 0 || devider) {
                code.index = index;
                throw code.makeError(
                    'Unexpected Token: ' +
                    JSON.stringify(code.charAt(index)) +
                    '.'
                );
            }
            style = 1;
            devider = true;
        } else if (!at && !name && ch === 46 && nextCh === 46) { /* .. */
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
            devider = false;
        } else if (!at && ch === 46) { /* . */
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
        } else if (ch === 64) { /* @ */
            if (at || dot) {
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

        if (ch === 10) {
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
        (ch === 61 && ch2 === 61 && ch3 === 61) || /* === */
        (ch === 33 && ch2 === 61 && ch3 === 61)    /* !== */
    ) {
        code.index = index;
        expression = new Token(code, TYPES.BINARY_EXPRESSION);
        expression.opperator = code.slice(index, index + 3);
        index += 2;
    } else if ( /* handle BINARY-EXPRESSION */
        (ch === 61 && ch2 === 61) || /* == */
        (ch === 33 && ch2 === 61) || /* != */
        (ch === 60 && ch2 === 61) || /* <= */
        (ch === 62 && ch2 === 61) || /* >= */
        (ch === 38 && ch2 === 38) || /* && */
        (ch === 124 && ch2 === 124)  /* || */
    ) {
        code.index = index;
        expression = new Token(code, TYPES.BINARY_EXPRESSION);
        expression.opperator = code.slice(index, index + 2);
        index++;
    } else if ( /* handle BINARY-EXPRESSION */
        (ch === 43) || /* + */
        (ch === 45) || /* - */
        (ch === 42) || /* * */
        (ch === 47) || /* / */
        (ch === 37) || /* % */
        (ch === 60) || /* < */
        (ch === 62)    /* > */
    ) {
        code.index = index;
        expression = new Token(code, TYPES.BINARY_EXPRESSION);
        expression.opperator = code.charAt(index);
    } else if ( /* handle UNARY-EXPRESSION */
        ch === 33 /* ! */
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

            if (ch === 10) {
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
        code.codePointAt(code.index) === 41
    ) {
        code.index++;
        close.close(code);
        return true;
    }

    if ( /* , */
        code.codePointAt(code.index) === 44
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

    if (ch !== 64) { /* @ */
        return null;
    }

    transform = new Token(code, TYPES.TRANSFORM);

    transform.name = '';
    transform.arguments = [];

    index++;

    for (; index < length; index++) {
        ch = code.codePointAt(index);

        if (HTML_IDENTIFIER(ch)) {
            transform.name += code.charAt(index);
        } else {
            break;
        }
    }

    ch = code.codePointAt(index);
    if (ch === 40) { /* ( */
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
    'DOM': [
        HTML_COMMENT,
        HTML_CLOSE_TAG,
        HTML_OPEN_TAG,
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
        BARS_COMMENT,
        BARS_CLOSE_BLOCK,
        BARS_ELSE_BLOCK,
        BARS_OPEN_BLOCK,
        WHITE_SPACE,
        HTML_ATTR,
    ],
    'VALUE': [
        STRING_END,
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
            console.log(
                repeat(' ', parseTokens.level) + mode.green + ' '+
                parseTokenFuncs[mode][i].name + '\n' +
                repeat(' ', parseTokens.level + 1) + bufferSlice(code, 5)
            );

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

function compile (str, file) {
    var code = new CodeBuffer(str, file),
        frag = new Token(code, TYPES.FRAGMENT);
        frag.nodes = [];

    parseTokens('DOM', code, frag.nodes);
    // parseTokens('LOGIC', code, frag.nodes);

    frag.close(code);

    return frag;
}

module.exports = compile;
