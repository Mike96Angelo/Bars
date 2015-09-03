var LOGGING = false;

var SELF_CLOSEING_TAGS = [
    'area',
    'base',
    'br',
    'col',
    'command',
    'embed',
    'hr',
    'img',
    'input',
    'keygen',
    'link',
    'meta',
    'param',
    'source',
    'track',
    'wbr'
];

var MODES = {
    'DOM-MODE': [
        60 /*'<'*/,  parseHTMLComment,
        60 /*'<'*/,  parseTagClose,
        60 /*'<'*/,  parseTag,
        123 /*'{'*/, parseBarsHelperHTML,
        123 /*'{'*/, parseBarsInsertHTML,
        123 /*'{'*/, parseBarsComment,
        123 /*'{'*/, parseBarsHelper,
        123 /*'{'*/, parseBarsPartial,
        123 /*'{'*/, parseBarsBlockElse,
        123 /*'{'*/, parseBarsBlockClose,
        123 /*'{'*/, parseBarsBlock,
        123 /*'{'*/, parseBarsInsert,
        null,        parseText
    ],
    'ATTR-MODE': [
        47 /*'/'*/, parseTagEnd,
        62 /*'>'*/, parseTagEnd,
        123 /*'{'*/, parseBarsComment,
        123 /*'{'*/, parseBarsBlockElse,
        123 /*'{'*/, parseBarsBlockClose,
        123 /*'{'*/, parseBarsBlock,
        null,        parseWhiteSpace,
        null,        parseAttr,
        null,        parseError
    ],
    'VALUE-MODE': [
        34 /*'"'*/,   parseStringClose,
        39 /*'\''*/,  parseStringClose,
        123 /*'{'*/,  parseBarsComment,
        123 /*'{'*/,  parseBarsHelper,
        123 /*'{'*/,  parseBarsBlockElse,
        123 /*'{'*/,  parseBarsBlockClose,
        123 /*'{'*/,  parseBarsBlock,
        123 /*'{'*/,  parseBarsInsert,
        null,         parseTextValue
    ],
};

var HASH = {
    '&quot;':      34,
    '&amp;':       38,
    '&lt;':        60,
    '&gt;':        62,
    '&nbsp;':      160,
    '&iexcl;':     161,
    '&cent;':      162,
    '&pound;':     163,
    '&curren;':    164,
    '&yen;':       165,
    '&brvbar;':    166,
    '&sect;':      167,
    '&uml;':       168,
    '&copy;':      169,
    '&ordf;':      170,
    '&not;':       172,
    '&shy;':       173,
    '&reg;':       174,
    '&macr;':      175,
    '&deg;':       176,
    '&plusmn;':    177,
    '&sup2;':      178,
    '&sup3;':      179,
    '&acute;':     180,
    '&micro;':     181,
    '&para;':      182,
    '&middot;':    183,
    '&cedil;':     184,
    '&sup1;':      185,
    '&ordm;':      186,
    '&raquo;':     187,
    '&frac14;':    188,
    '&frac12;':    189,
    '&frac34;':    190,
    '&iquest;':    191,
    '&Agrave;':    192,
    '&Aacute;':    193,
    '&Acirc;':     194,
    '&Atilde;':    195,
    '&Auml;':      196,
    '&Aring;':     197,
    '&AElig;':     198,
    '&Ccedil;':    199,
    '&Egrave;':    200,
    '&Eacute;':    201,
    '&Ecirc;':     202,
    '&Euml;':      203,
    '&Igrave;':    204,
    '&Iacute;':    205,
    '&Icirc;':     206,
    '&Iuml;':      207,
    '&ETH;':       208,
    '&Ntilde;':    209,
    '&Ograve;':    210,
    '&Oacute;':    211,
    '&Ocirc;':     212,
    '&Otilde;':    213,
    '&Ouml;':      214,
    '&times;':     215,
    '&Oslash;':    216,
    '&Ugrave;':    217,
    '&Uacute;':    218,
    '&Ucirc;':     219,
    '&Uuml;':      220,
    '&Yacute;':    221,
    '&THORN;':     222,
    '&szlig;':     223,
    '&agrave;':    224,
    '&aacute;':    225,
    '&acirc;':     226,
    '&atilde;':    227,
    '&auml;':      228,
    '&aring;':     229,
    '&aelig;':     230,
    '&ccedil;':    231,
    '&egrave;':    232,
    '&eacute;':    233,
    '&ecirc;':     234,
    '&euml;':      235,
    '&igrave;':    236,
    '&iacute;':    237,
    '&icirc;':     238,
    '&iuml;':      239,
    '&eth;':       240,
    '&ntilde;':    241,
    '&ograve;':    242,
    '&oacute;':    243,
    '&ocirc;':     244,
    '&otilde;':    245,
    '&ouml;':      246,
    '&divide;':    247,
    '&oslash;':    248,
    '&ugrave;':    249,
    '&uacute;':    250,
    '&ucirc;':     251,
    '&uuml;':      252,
    '&yacute;':    253,
    '&thorn;':     254,
    '&euro;':      8364,
};

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

    code = HASH[str];

    if (typeof code !== 'number') {
        code = parseInt( str.slice(2, -1), 10);
    }

    if (typeof code === 'number' && !Number.isNaN(code)){
        return String.fromCharCode(code);
    }

    return str;
}

function getLineAndColumn(buffer, index) {
    var lines = 1,
        columns = 0;

    for (var i = 0; i < index; i++) {
        if (buffer[i] === '\n') {
            lines++;
            columns = 1;
        } else {
            columns++;
        }
    }

    return {
        line: lines,
        column: columns
    };
}

function throwError(buffer, index, message) {
    var lineAndColumn = getLineAndColumn(buffer, index);
    throw new SyntaxError(message + ' at ' + lineAndColumn.line+ ':' + lineAndColumn.column);
}

function parseError(mode, tree, index, length, buffer, indent) {
    throwError(buffer, index, 'Unexpected token: ' + JSON.stringify(buffer[index])+'.');
}

function parseTagEnd(mode, tree, index, length, buffer, indent, close) {
    var ch = buffer.codePointAt(index);

    if (ch === 62 /*'>'*/) {
        LOGGING && console.log(indent + 'parseTagEnd');
        close.closed = true;
        return index;
    }

    if (ch === 47 /*'/'*/ && buffer.codePointAt(index + 1) === 62 /*'>'*/) {
        LOGGING && console.log(indent + 'parseTagEnd');
        index++;
        close.selfClosed = true;
        return index;
    }

    return null;
}

function parseAttr(mode, tree, index, length, buffer, indent) {
    var ch,
        token = {
            type: 'ATTR-NODE',
            name: '',
            nodes: []
        };

    for (; index < length; index++) {
        ch = buffer.codePointAt(index);

        if (!HTML_IDENTIFIER(ch)) {
            break;
        }

        token.name += buffer[index];
    }

    if (token.name) {
        LOGGING && console.log(indent + 'parseAttr');

        tree.push(token);
        /* ch === '=' */
        if (ch === 61) {
            // move past =
            index++;

            ch = buffer.codePointAt(index);

            /* ch === '"' || ch === '\'' */
            if (ch === 34 || ch === 39) {
                var stringToken = {
                    type: 'STRING-NODE',
                    name: ch
                };

                index++;
                index = parse('VALUE-MODE', token.nodes, index, length, buffer, indent, stringToken);

                if (!stringToken.closed) {
                    throwError(buffer, index, 'Missing closing tag: expected \'' + stringToken + '\'.');
                }
            } else {
                var textValueToken = {
                    type: 'TEXT-NODE',
                    content: ''
                };
                for (; index < length; index++) {
                    ch = buffer.codePointAt(index);

                    if (!HTML_IDENTIFIER(ch)) {
                        break;
                    }

                    textValueToken.content += buffer[index];
                }

                if (textValueToken.content) {
                    token.nodes.push(textValueToken);
                    index--;
                } else {
                    throwError(buffer, index, 'Unexpected end of input.');
                }
            }
        } else {
            index--;
        }

        return index;
    }

    return null;
}

function parseWhiteSpace(mode, tree, index, length, buffer, indent) {
    var ch,
        whitespace = 0;


    for (; index < length; index++) {
        ch = buffer.codePointAt(index);

        if (!WHITESPACE(ch)) {

            break;
        }
        whitespace++;
    }

    if (whitespace) {
        LOGGING && console.log(indent + 'parseWhiteSpace');
        index--;
        return index;
    }

    return null;
}

function parseStringClose(mode, tree, index, length, buffer, indent, close, noErrorOnMismatch) {
    var token = {
        type: 'STRING-NODE',
        name: buffer.codePointAt(index)
    };

    if (token.type === close.type) {
        if (token.name === close.name) {
            close.closed = true;
            return index;
        }
        return null;
    }

    throwError(buffer, index, 'Mismatched closing tag: expected \'' +close.name+ '\' but found \'' +token.name+ '\'.');
}

function parse(mode, tree, index, length, buffer, indent, close) {
    LOGGING && console.log(indent + 'parse - ', mode);

    // LOGGING && console.log({mode: mode, tree: tree, index: index, length: length, buffer: buffer, close: close, indent: indent});

    var ch,
        testCh,
        oldIndex,
        oldIndent = indent,
        oldElsed,
        newIndex,
        parseFuncs = MODES[mode],
        parseFuncsLength = parseFuncs.length,
        parseFunc,
        i;

    indent += '  ';

    loop: for (; index < length; index++) {
        ch = buffer.codePointAt(index);

        for (i = 0; i < parseFuncsLength; i++) {
            testCh = parseFuncs[i];
            parseFunc = parseFuncs[++i];

            if (ch === testCh || testCh === null) {
                oldIndex = index;
                oldElsed = close && close.elsed;

                newIndex = parseFunc(mode, tree, index, length, buffer, indent, close);

                if (typeof newIndex === 'number') {
                    index = newIndex;
                }

                if (
                    close &&
                    (
                        (close.closed) ||
                        (close.elsed && !oldElsed)
                    )
                ) {
                    break loop;
                }

                if (typeof newIndex === 'number') {
                    break;
                }
            }
        }
    }

    LOGGING && console.log(oldIndent + '<<<');

    return index;
}

function parseTag(mode, tree, index, length, buffer, indent) {
    LOGGING && console.log(indent+'parseTag');

    var ch,
        token = {
            type: 'TAG-NODE',
            name: '',
            nodes: [],
            attrs: []
        };

    index++; // move past <
    /* Get Name */
    for (; index < length; index++) {
        ch = buffer.codePointAt(index);

        if (!HTML_IDENTIFIER(ch)) {
            break;
        }

        token.name += buffer[index];
    }

    if (!token.name) {
        throwError(buffer, index, 'Missing tag name.');
    }

    index = parse('ATTR-MODE', token.attrs, index, length, buffer, indent, token);

    if (!token.closed && !token.selfClosed) {
        throwError(buffer, index, 'Unexpected end of input.');
    }

    delete token.closed;

    if (token.selfClosed) {
        delete token.selfClosed;
        return index;
    }

    if (token.name === 'script' || token.name === 'style') {
        var textToken = {
            type: 'TEXT-NODE',
            content: ''
        };

        for (; index < length; index++) {
            ch = buffer.codePointAt(index);

            if (ch === 60 /*'<'*/) {
                index = parseTagClose(mode, tree, index, length, buffer, indent, token, true);

                if (token.closed) {
                    delete token.closed;
                    break;
                }
            }

            textToken.content += buffer[index];
        }

        if (textToken.content) {
            token.nodes.push(textToken);
        }
    } else if (SELF_CLOSEING_TAGS.indexOf(token.name) === -1) {
        index++;
        index = parse(mode, token.nodes, index, length, buffer, indent, token);
    } else {
        token.closed = true;
    }

    if (token.closed) {
        delete token.closed;
        tree.push(token);
    } else {
        throwError(buffer, index, 'Missing closing tag: expected \'' + token.name + '\'.');
    }

    return index;
}

function parseTagClose(mode, tree, index, length, buffer, indent, close, noErrorOnMismatch) {

    if (buffer.codePointAt(index + 1) !== 47 /*'/'*/) return null;

    LOGGING && console.log(indent+'parseTagClose');

    var ch,
        token = {
            type: 'TAG-NODE',
            name: ''
        },
        nameDone = false,
        end = false;

    index+=2; // move past </
    /* Get Name */
    for (; index < length; index++) {
        ch = buffer.codePointAt(index);

        if (!nameDone && HTML_IDENTIFIER(ch)) {
            token.name += buffer[index];
        } else {
            nameDone = true;
        }

        if (ch === 62 /*'>'*/) {
            end = true;
            break;
        }
    }

    if (!end) {
        throwError(buffer, index, 'Unexpected end of input.');
    }

    if (!close) {
        throwError(buffer, index, 'Unexpected closing tag: \'' +token.name+ '\'.');
    }

    if (token.type === close.type && token.name === close.name) {
        close.closed = true;
    } else if (noErrorOnMismatch) {
        /* Canceling Parse */
        return null;
    } else {
        throwError(buffer, index, 'Mismatched closing tag: expected \'' +close.name+ '\' but found \'' +token.name+ '\'.');
    }

    return index;
}

function parseText(mode, tree, index, length, buffer, indent) {
    var ch,
        isEntity = false,
        entityStr = '',
        token = {
            type: 'TEXT-NODE',
            content: ''
        };

    for (; index < length; index++) {
        ch = buffer.codePointAt(index);

        if (ch === 60 /*'<'*/ || ch === 123 /*'{'*/ && buffer.codePointAt(index + 1) === 123 /*'{'*/) {
            token.content += entityStr;
            index--;
            break;
        }

        if (ch === 38 /*'&'*/) {
            isEntity = true;
            entityStr = buffer[index];

            continue;
        } else if (isEntity && ch === 59 /*';'*/) {
            entityStr += buffer[index];

            token.content += getHTMLUnEscape(entityStr);

            isEntity = false;
            entityStr = '';

            continue;
        }

        if (isEntity && HTML_ENTITY(ch)) {
            entityStr += buffer[index];
        } else {
            token.content += entityStr;
            isEntity = false;
            entityStr = '';

            token.content += buffer[index];
        }
    }

    if (token.content) {
        LOGGING && console.log(indent+'parseText');
        tree.push(token);
        return index;
    }

    return null;
}

function parseTextValue(mode, tree, index, length, buffer, indent, close) {
    var ch,
        token = {
            type: 'TEXT-NODE',
            content: ''
        };

    for (; index < length; index++) {
        ch = buffer.codePointAt(index);

        if (ch === 123 /*'{'*/ || (close && ch === close.name && buffer[index - 1] !== '\\')) {
            index--;
            break;
        }

        token.content += buffer[index];
    }

    if (token.content) {
        LOGGING && console.log(indent+'parseText');
        tree.push(token);
        return index;
    }

    return null;
}

function parseBarsInsert(mode, tree, index, length, buffer, indent) {
    LOGGING && console.log(indent+'parseBarsInsert');

    if (buffer.codePointAt(index + 1) !== 123 /*'{'*/) {
        return null;
    }

    var ch,
        token = {
            type: 'TEXT-NODE',
            contextPath: ''
        }, endChars = 0;

    // move past {{
    index+=2;
    loop: for (; index < length; index++) {
        ch = buffer.codePointAt(index);

        if (ch === 125 /*'}'*/) {
            endChars++;
            index++;

            for (; index < length; index++) {
                ch = buffer.codePointAt(index);

                if (ch === 125 /*'}'*/) {
                    endChars++;
                } else {
                    throwError(buffer, index, 'Unexpected character: expected \'}\' but found \'' +buffer[index]+ '\'.');
                }

                if (endChars === 2) {
                    break loop;
                }
            }
        }
        token.contextPath += buffer[index];
    }

    tree.push(token);

    return index;
}

function parseBarsInsertHTML(mode, tree, index, length, buffer, indent) {
    LOGGING && console.log(indent+'parseBarsInsert');

    if (buffer.codePointAt(index + 1) !== 123 /*'{'*/) {
        return null;
    }

    if (buffer.codePointAt(index + 2) !== 123 /*'{'*/) {
        return null;
    }

    var ch,
        token = {
            type: 'FRAG-NODE',
            contextPath: ''
        }, endChars = 0;

    // move past {{{
    index += 3;
    loop: for (; index < length; index++) {
        ch = buffer.codePointAt(index);

        if (ch === 125 /*'}'*/) {
            endChars++;
            index++;

            for (; index < length; index++) {
                ch = buffer.codePointAt(index);

                if (ch === 125 /*'}'*/) {
                    endChars++;
                } else {
                    throwError(buffer, index, 'Unexpected character: expected \'}\' but found \'' +buffer[index]+ '\'.');
                }

                if (endChars === 3) {
                    break loop;
                }
            }
        }

        token.contextPath += buffer[index];
    }

    tree.push(token);

    return index;
}

function parseBarsPartial(mode, tree, index, length, buffer, indent) {
    if (buffer.codePointAt(index + 1) !== 123 /*'{'*/) {
        return null;
    }

    if (buffer.codePointAt(index + 2) !== 62 /*'>'*/) {
        /* Canceling Parse */
        return null;
    }
    LOGGING && console.log(indent+'parseBarsPartial');

    var ch,
        token = {
            type: 'PARTIAL-NODE',
            name: '',
            blockString: ''
        }, endChars = 0;

    // move past {{>
    index += 3;

    for (; index < length; index++) {
        ch = buffer.codePointAt(index);

        if (HTML_IDENTIFIER(ch)) {
            token.name += buffer[index];
        } else {
            break;
        }
    }

    if (!token.name) {
        throwError(buffer, index, 'Missing partial name.');
    }

    loop: for (; index < length; index++) {
        ch = buffer.codePointAt(index);

        if (ch === 125 /*'}'*/) {
            endChars++;
            index++;

            for (; index < length; index++) {
                ch = buffer.codePointAt(index);

                if (ch === 125 /*'}'*/) {
                    endChars++;
                } else {
                    throwError(buffer, index, 'Unexpected character: expected \'}\' but found \'' +buffer[index]+ '\'.');
                }

                if (endChars === 2) {
                    break loop;
                }
            }
        }

        token.blockString += buffer[index];
    }

    token.blockString = token.blockString.trim();

    tree.push(token);

    return index;
}

function parseBarsHelper(mode, tree, index, length, buffer, indent) {
    if (buffer.codePointAt(index + 1) !== 123 /*'{'*/) {
        return null;
    }

    if (buffer.codePointAt(index + 2) !== 63 /*'?'*/) {
        /* Canceling Parse */
        return null;
    }
    LOGGING && console.log(indent+'parseBarsHelper');

    var ch,
        token = {
            type: 'TEXT-NODE',
            name: '',
            blockString: ''
        }, endChars = 0;

    // move past {{?
    index += 3;

    for (; index < length; index++) {
        ch = buffer.codePointAt(index);

        if (HTML_IDENTIFIER(ch)) {
            token.name += buffer[index];
        } else {
            break;
        }
    }

    if (!token.name) {
        throwError(buffer, index, 'Missing helper name.');
    }

    loop: for (; index < length; index++) {
        ch = buffer.codePointAt(index);

        if (ch === 125 /*'}'*/) {
            endChars++;
            index++;

            for (; index < length; index++) {
                ch = buffer.codePointAt(index);

                if (ch === 125 /*'}'*/) {
                    endChars++;
                } else {
                    throwError(buffer, index, 'Unexpected character: expected \'}\' but found \'' +buffer[index]+ '\'.');
                }

                if (endChars === 2) {
                    break loop;
                }
            }
        }

        token.blockString += buffer[index];
    }

    token.blockString = token.blockString.trim();

    tree.push(token);

    return index;
}

function parseBarsHelperHTML(mode, tree, index, length, buffer, indent) {
    if (buffer.codePointAt(index + 1) !== 123 /*'{'*/) {
        return null;
    }

    if (buffer.codePointAt(index + 2) !== 123 /*'{'*/) {
        /* Canceling Parse */
        return null;
    }

    if (buffer.codePointAt(index + 3) !== 63 /*'?'*/) {
        /* Canceling Parse */
        return null;
    }
    LOGGING && console.log(indent+'parseBarsHelperHTML');

    var ch,
        token = {
            type: 'FRAG-NODE',
            name: '',
            blockString: ''
        }, endChars = 0;

    // move past {{{?
    index += 4;

    for (; index < length; index++) {
        ch = buffer.codePointAt(index);

        if (HTML_IDENTIFIER(ch)) {
            token.name += buffer[index];
        } else {
            break;
        }
    }

    if (!token.name) {
        throwError(buffer, index, 'Missing helper name.');
    }

    loop: for (; index < length; index++) {
        ch = buffer.codePointAt(index);

        if (ch === 125 /*'}'*/) {
            endChars++;
            index++;

            for (; index < length; index++) {
                ch = buffer.codePointAt(index);

                if (ch === 125 /*'}'*/) {
                    endChars++;
                } else {
                    throwError(buffer, index, 'Unexpected character: expected \'}\' but found \'' +buffer[index]+ '\'.');
                }

                if (endChars === 3) {
                    break loop;
                }
            }
        }

        token.blockString += buffer[index];
    }

    token.blockString = token.blockString.trim();

    tree.push(token);

    return index;
}

function parseBarsComment(mode, tree, index, length, buffer, indent) {
    if (buffer.codePointAt(index + 1) !== 123 /*'{'*/) {
        return null;
    }

    if (buffer.codePointAt(index + 2) !== 33 /*'!'*/) {
        return null;
    }

    var ch,
        token = {
            type: 'COMMENT-NODE',
            comment: ''
        }, endChars = 0;

    // move past {{!
    index+=3;
    loop: for (; index < length; index++) {
        ch = buffer.codePointAt(index);

        if (ch === 125 /*'}'*/) {
            endChars++;
            index++;

            for (; index < length; index++) {
                ch = buffer.codePointAt(index);

                if (ch === 125 /*'}'*/) {
                    endChars++;
                } else {
                    throwError(buffer, index, 'Unexpected character: expected \'}\' but found \'' +buffer[index]+ '\'.');
                }

                if (endChars === 2) {
                    break loop;
                }
            }
        }
        token.comment += buffer[index];
    }

    // TODO: Maybe create comment node?
    // if (token.comment) {
        // LOGGING && console.log(indent+'parseBarsComment');

    //     tree.push(token);

    //     return index;
    // }

    return index;
}

function parseHTMLComment(mode, tree, index, length, buffer, indent) {
    if (buffer.codePointAt(index + 1) !== 33 /*'!'*/) {
        return null;
    }

    if (buffer.codePointAt(index + 2) !== 45 /*'-'*/) {
        return null;
    }

    if (buffer.codePointAt(index + 3) !== 45 /*'-'*/) {
        return null;
    }

    var ch,
        token = {
            type: 'COMMENT-NODE',
            comment: ''
        },
        endChars = 0;

    // move past <!--
    index+=4;
    loop: for (; index < length; index++) {
        ch = buffer.codePointAt(index);

        if (ch === 45 /*'-'*/) {
            endChars++;
            index++;

            for (; index < length; index++) {
                ch = buffer.codePointAt(index);

                if (ch === 45 /*'-'*/) {
                    endChars++;
                } else {
                    endChars = 0;
                    break;
                }

                if (endChars >= 2) {
                    if (buffer.codePointAt(index + 1) === 62 /*'>'*/) {
                        index++;
                        break loop;
                    }
                }
            }
        }
        token.comment += buffer[index];
    }

    // TODO: Maybe create comment node?
    // if (token.comment) {
        // LOGGING && console.log(indent+'parseBarsComment');

    //     tree.push(token);

    //     return index;
    // }

    return index;
}

function parseBarsBlock(mode, tree, index, length, buffer, indent) {

    if (buffer.codePointAt(index + 1) !== 123 /*'{'*/) {
        throwError(buffer, index, 'Unexpected end of input.');
    }

    if (buffer.codePointAt(index + 2) !== 35 /*'#'*/) {
        /* Canceling Parse */
        return null;
    }
    LOGGING && console.log(indent+'parseBarsBlock');

    var ch,
        token = {
            type: 'BLOCK-NODE',
            name: '',
            blockString: '',
            nodesFrag: {
                type: 'FRAG-NODE',
                nodes: [],
            },
            alternateFrag: {
                type: 'FRAG-NODE',
                nodes: []
            }
        }, endChars = 0;

    // move past {{#
    index += 3;

    for (; index < length; index++) {
        ch = buffer.codePointAt(index);

        if (HTML_IDENTIFIER(ch)) {
            token.name += buffer[index];
        } else {
            break;
        }
    }

    if (!token.name) {
        throwError(buffer, index, 'Missing block name.');
    }

    loop: for (; index < length; index++) {
        ch = buffer.codePointAt(index);

        if (ch === 125 /*'}'*/) {
            endChars++;
            index++;

            for (; index < length; index++) {
                ch = buffer.codePointAt(index);

                if (ch === 125 /*'}'*/) {
                    endChars++;
                } else {
                    throwError(buffer, index, 'Unexpected character: expected \'}\' but found \'' +buffer[index]+ '\'.');
                }

                if (endChars === 2) {
                    break loop;
                }
            }
        }

        token.blockString += buffer[index];
    }

    token.blockString = token.blockString.trim();

    index++;
    index = parse(mode, token.nodesFrag.nodes, index, length, buffer, indent, token);

    if (token.elsed && !token.closed) {
        index++;
        index = parse(mode, token.alternateFrag.nodes, index, length, buffer, indent, token);
    }

    if (token.closed) {
        delete token.closed;
        delete token.elsed;
        tree.push(token);
    } else {
        throwError(buffer, index, 'Missing closing tag: expected \'' + token.name + '\'.');
    }

    return index;
}

function parseBarsBlockClose(mode, tree, index, length, buffer, indent, close, noErrorOnMismatch) {

    if (buffer.codePointAt(index + 1) !== 123 /*'{'*/) {
        throwError(buffer, index, 'Unexpected end of input.');
    }

    if (buffer.codePointAt(index + 2) !== 47 /*'/'*/) {
        return null;
    }

    LOGGING && console.log(indent+'parseBarsBlockClose');


    var ch,
        token = {
            type: 'BLOCK-NODE',
            name: ''
        },
        endChars = 0;

    // move past {{#
    index += 3;

    for (; index < length; index++) {
        ch = buffer.codePointAt(index);

        if (HTML_IDENTIFIER(ch)) {
            token.name += buffer[index];
        } else {
            break;
        }
    }

    loop: for (; index < length; index++) {
        ch = buffer.codePointAt(index);

        if (ch === 125 /*'}'*/) {
            endChars++;
            index++;

            for (; index < length; index++) {
                ch = buffer.codePointAt(index);

                if (ch === 125 /*'}'*/) {
                    endChars++;
                } else {
                    throwError(buffer, index, 'Unexpected character: expected \'}\' but found \'' +buffer[index]+ '\'.');
                }

                if (endChars === 2) {
                    break loop;
                }
            }
        }
    }

    if (!close) {
        throwError(buffer, index, 'Unexpected closing tag: \'' +token.name+ '\'.');
    }

    if (token.type === close.type && token.name === close.name) {
        close.closed = true;
    } else if (noErrorOnMismatch) {
        /* Canceling Parse */
        return null;
    } else {
        throwError(buffer, index, 'Mismatched closing tag: expected \'' +close.name+ '\' but found \'' +token.name+ '\'.');
    }

    return index;
}

function parseBarsBlockElse(mode, tree, index, length, buffer, indent, close) {

    if (buffer.codePointAt(index + 1) !== 123 /*'{'*/) {
        throwError(buffer, index, 'Unexpected end of input.');
    }

    var ch,
        name = '',
        endChars = 0;

    // move past {{
    index += 2;

    loop: for (; index < length; index++) {
        ch = buffer.codePointAt(index);

        if (ch === 125 /*'}'*/) {
            endChars++;
            index++;

            for (; index < length; index++) {
                ch = buffer.codePointAt(index);

                if (ch === 125 /*'}'*/) {
                    endChars++;
                } else {
                    throwError(buffer, index, 'Unexpected character: expected \'}\' but found \'' +buffer[index]+ '\'.');
                }

                if (endChars === 2) {
                    break loop;
                }
            }
        }
        name += buffer[index];
    }

    if (close && close.type === 'BLOCK-NODE' && name === 'else') {
        if (close.elsed) {
            throwError(buffer, index, 'Unexpected else token.');
        }

        close.elsed = true;

        LOGGING && console.log(indent+'parseBarsBlockElse');
        return index;
    } else if (!close && name === 'else') {
        throwError(buffer, index, 'Unexpected else tag.');
    } else {
        /* Canceling Parse */
        return null;
    }
}

function compile(buffer) {
    var n = Date.now();
    var tree = {
        type: 'FRAG-NODE',
        nodes: []
    };

    LOGGING && console.log('compile');

    parse('DOM-MODE', tree.nodes, 0, buffer.length, buffer, '  ', null);

    LOGGING && console.log('compiled');
    //
    LOGGING && console.log(Date.now()-n);

    return tree;
    // return JSON.stringify(tree, null, 2);
}

module.exports = compile;
