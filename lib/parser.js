var selfClosers = [
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

var modes = {
    'DOM-MODE': [
        '<', parseTagClose,
        '<', parseTag,
        '{', parseBarsBlockElse,
        '{', parseBarsBlockClose,
        '{', parseBarsBlock,
        '{', parseBarsInsert,
        '',  parseText
    ],
    'ATTR-MODE': [
        '/', parseTagEnd,
        '>', parseTagEnd,
        '{', parseBarsBlockElse,
        '{', parseBarsBlockClose,
        '{', parseBarsBlock,
        '',  parseWhiteSpace,
        '',  parseAttr,
        '',  parseError
    ],
    'VALUE-MODE': [
        '"',  parseStringClose,
        '\'', parseStringClose,
        '{',  parseBarsBlockElse,
        '{',  parseBarsBlockClose,
        '{',  parseBarsBlock,
        '{',  parseBarsInsert,
        '',   parseTextValue
    ],
};

var VALID_IDENTIFIER = /^[_A-Za-z0-9-]$/;
var WHITESPACE = /^\s$/;

function parseError(mode, tree, index, length, buffer, indent) {
    console.log(JSON.stringify(buffer[index-1]),JSON.stringify(buffer[index]), {mode: mode, tree: tree, index: index, length: length, buffer: buffer, close: close, indent: indent});
    throw new SyntaxError('Unexpected token: ' + JSON.stringify(buffer[index]));
}

function parseTagEnd(mode, tree, index, length, buffer, indent, close) {
    var ch = buffer[index];

    if (ch === '>') {
        console.log(indent + 'parseTagEnd');
        close.closed = true;
        return index;
    }

    if (ch === '/' && buffer[index + 1] === '>') {
        console.log(indent + 'parseTagEnd');
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
        ch = buffer[index];

        if (!VALID_IDENTIFIER.test(ch)) {
            break;
        }

        token.name += ch;
    }

    if (token.name) {
        console.log(indent + 'parseAttr');

        tree.push(token);

        if (ch === '=') {
            // move past =
            index++;

            ch = buffer[index];

            if (ch === '\'' || ch === '"') {
                var stringToken = {
                    type: 'STRING-NODE',
                    name: ch
                };

                index++;
                index = parse('VALUE-MODE', token.nodes, index, length, buffer, indent, stringToken);

                if (!stringToken.closed) {
                    throw new SyntaxError('Missing closing tag: expected \'' + stringToken + '\'.');
                }
            } else {
                var textValueToken = {
                    type: 'TEXT-NODE',
                    staticMap: {
                        textContent: ''
                    }
                };
                for (; index < length; index++) {
                    ch = buffer[index];

                    if (!VALID_IDENTIFIER.test(ch)) {
                        break;
                    }

                    textValueToken.staticMap.textContent += ch;
                }

                if (textValueToken.staticMap.textContent) {
                    token.nodes.push(textValueToken);
                    index--;
                } else {
                    throw new SyntaxError('Unexpected end of input.');
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
    // console.log(JSON.stringify(buffer[index]), {mode: mode, tree: tree, index: index, length: length, buffer: buffer, close: close, indent: indent});

    var ch,
        whitespace = 0;


    for (; index < length; index++) {
        ch = buffer[index];

        if (!WHITESPACE.test(ch)) {

            break;
        }
        whitespace++;
    }

    // console.log(JSON.stringify(buffer[index]), {mode: mode, tree: tree, index: index, length: length, buffer: buffer, close: close, indent: indent});


    if (whitespace) {
        console.log(indent + 'parseWhiteSpace');
        index--;
        return index;
    }

    return null;
}

function parseStringClose(mode, tree, index, length, buffer, indent, close, noErrorOnMismatch) {
    var token = {
        type: 'STRING-NODE',
        name: buffer[index]
    };

    if (token.type === close.type) {
        if (token.name === close.name) {
            close.closed = true;
            return index;
        }
        return null;
    }

    throw new SyntaxError('Mismatched closing tag: expected \'' +close.name+ '\' but found \'' +token.name+ '\'.');
}

// function parseString(mode, tree, index, length, buffer, indent) {
//     var ch,
//         opener = buffer[index],
//         token = {
//             type: 'STRING-NODE',
//             value: ''
//         };

//     /* go past opener */
//     index++;

//     for (; index < length; index++) {
//         ch = buffer[index];

//         if (ch === '\n' && buffer[index - 1] !== '\\') {
//             throw new SyntaxError('Unexpected end of input.');
//         }

//         if (ch === opener && buffer[index - 1] !== '\\') {
//             break;
//         }

//         token.value += ch;
//     }

//     tree.push(token);

//     return index;
// }

function parse(mode, tree, index, length, buffer, indent, close) {
    console.log(indent + 'parse - ', mode);

    // console.log({mode: mode, tree: tree, index: index, length: length, buffer: buffer, close: close, indent: indent});

    var ch,
        testCh,
        oldIndex,
        oldIndent = indent,
        oldElsed,
        newIndex,
        parseFuncs = modes[mode],
        parseFuncsLength = parseFuncs.length,
        parseFunc,
        i;

    indent += '  ';

    loop: for (; index < length; index++) {
        ch = buffer[index];

        for (i = 0; i < parseFuncsLength; i++) {
            testCh = modes[mode][i];
            parseFunc = parseFuncs[++i];

            if (ch === testCh || !testCh) {
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

    console.log(oldIndent + '<<<');

    return index;
}

function parseTag(mode, tree, index, length, buffer, indent) {
    console.log(indent+'parseTag');

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
        ch = buffer[index];

        if (!VALID_IDENTIFIER.test(ch)) {
            break;
        }

        token.name += ch;
    }

    index = parse('ATTR-MODE', token.attrs, index, length, buffer, indent, token);

    if (!token.closed && !token.selfClosed) {
        throw new SyntaxError('Unexpected end of input.');
    }

    delete token.closed;

    if (token.selfClosed) {
        delete token.selfClosed;
        return index;
    }

    if (token.name === 'script' || token.name === 'style') {
        var textToken = {
            type: 'TEXT-NODE',
            staticMap: {
                textContent: ''
            }
        };

        for (; index < length; index++) {
            ch = buffer[index];

            if (ch === '<') {
                index = parseTagClose(mode, tree, index, length, buffer, indent, token, true);

                if (token.closed) {
                    delete token.closed;
                    break;
                }
            }

            textToken.staticMap.textContent += ch;
        }

        if (textToken.staticMap.textContent) {
            token.nodes.push(textToken);
        }
    } else if (selfClosers.indexOf(token.name) === -1) {
        index++;
        index = parse(mode, token.nodes, index, length, buffer, indent, token);
    }

    if (token.closed) {
        delete token.closed;
        tree.push(token);
    } else {
        throw new SyntaxError('Missing closing tag: expected \'' + token.name + '\'.');
    }

    return index;
}

function parseTagClose(mode, tree, index, length, buffer, indent, close, noErrorOnMismatch) {

    if (buffer[index + 1] !== '/') return null;

    console.log(indent+'parseTagClose');

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
        ch = buffer[index];

        if (!nameDone && VALID_IDENTIFIER.test(ch)) {
            token.name += ch;
        } else {
            nameDone = true;
        }

        if (ch === '>') {
            end = true;
            break;
        }
    }

    if (!end) {
        throw new SyntaxError('Unexpected end of input.');
    }

    if (!close) {
        throw new SyntaxError('Unexpected closing tag: \'' +token.name+ '\'.');
    }

    if (token.type === close.type && token.name === close.name) {
        close.closed = true;
    } else if (noErrorOnMismatch) {
        /* Canceling Parse */
        return null;
    } else {
        throw new SyntaxError('Mismatched closing tag: expected \'' +close.name+ '\' but found \'' +token.name+ '\'.');
    }

    return index;
}

function parseText(mode, tree, index, length, buffer, indent) {
    var ch,
        token = {
            type: 'TEXT-NODE',
            staticMap: {
                textContent: ''
            }
        };

    for (; index < length; index++) {
        ch = buffer[index];

        if (ch === '<' || ch === '{') {
            index--;
            break;
        }

        token.staticMap.textContent += ch;
    }

    if (token.staticMap.textContent) {
        console.log(indent+'parseText');
        tree.push(token);
        return index;
    }

    return null;
}

function parseTextValue(mode, tree, index, length, buffer, indent, close) {
    var ch,
        token = {
            type: 'TEXT-NODE',
            staticMap: {
                textContent: ''
            }
        };

    for (; index < length; index++) {
        ch = buffer[index];

        if (ch === '{' || (close && ch === close.name && buffer[index - 1] !== '\\')) {
            index--;
            break;
        }

        token.staticMap.textContent += ch;
    }

    if (token.staticMap.textContent) {
        console.log(indent+'parseText');
        tree.push(token);
        return index;
    }

    return null;
}

function parseBarsInsert(mode, tree, index, length, buffer, indent) {
    console.log(indent+'parseBarsInsert');

    if (buffer[index + 1] !== '{') {
        throw new SyntaxError('Unexpected end of input.');
    }

    var ch,
        token = {
            type: 'TEXT-NODE',
            contextMap: {
                textContent: ''
            }
        }, endChars = 0;

    // move past {{
    index+=2;
    loop: for (; index < length; index++) {
        ch = buffer[index];

        if (ch === '}') {
            endChars++;
            index++;

            for (; index < length; index++) {
                ch = buffer[index];

                if (ch === '}') {
                    endChars++;
                } else {
                    throw new SyntaxError('Unexpected character: expected \'}\' but found \'' +ch+ '\'.');
                }

                if (endChars === 2) {
                    break loop;
                }
            }
        }
        token.contextMap.textContent += ch;
    }

    tree.push(token);

    return index;
}

function parseBarsBlock(mode, tree, index, length, buffer, indent) {

    if (buffer[index + 1] !== '{') {
        throw new SyntaxError('Unexpected end of input.');
    }

    if (buffer[index + 2] !== '#') {
        /* Canceling Parse */
        return null;
    }
    console.log(indent+'parseBarsBlock');

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
        ch = buffer[index];

        if (VALID_IDENTIFIER.test(ch)) {
            token.name += ch;
        } else {
            break;
        }
    }

    loop: for (; index < length; index++) {
        ch = buffer[index];

        if (ch === '}') {
            endChars++;
            index++;

            for (; index < length; index++) {
                ch = buffer[index];

                if (ch === '}') {
                    endChars++;
                } else {
                    throw new SyntaxError('Unexpected character: expected \'}\' but found \'' +ch+ '\'.');
                }

                if (endChars === 2) {
                    break loop;
                }
            }
        }

        token.blockString += ch;
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
        throw new SyntaxError('Missing closing tag: expected \'' + token.name + '\'.');
    }

    return index;
}

function parseBarsBlockClose(mode, tree, index, length, buffer, indent, close, noErrorOnMismatch) {

    if (buffer[index + 1] !== '{') {
        throw new SyntaxError('Unexpected end of input.');
    }

    if (buffer[index + 2] !== '/') {
        return null;
    }

    console.log(indent+'parseBarsBlockClose');


    var ch,
        token = {
            type: 'BLOCK-NODE',
            name: ''
        },
        endChars = 0;

    // move past {{#
    index += 3;

    for (; index < length; index++) {
        ch = buffer[index];

        if (VALID_IDENTIFIER.test(ch)) {
            token.name += ch;
        } else {
            break;
        }
    }

    loop: for (; index < length; index++) {
        ch = buffer[index];

        if (ch === '}') {
            endChars++;
            index++;

            for (; index < length; index++) {
                ch = buffer[index];

                if (ch === '}') {
                    endChars++;
                } else {
                    throw new SyntaxError('Unexpected character: expected \'}\' but found \'' +ch+ '\'.');
                }

                if (endChars === 2) {
                    break loop;
                }
            }
        }
    }

    if (!close) {
        throw new SyntaxError('Unexpected closing tag: \'' +token.name+ '\'.');
    }

    if (token.type === close.type && token.name === close.name) {
        close.closed = true;
    } else if (noErrorOnMismatch) {
        /* Canceling Parse */
        return null;
    } else {
        throw new SyntaxError('Mismatched closing tag: expected \'' +close.name+ '\' but found \'' +token.name+ '\'.');
    }

    return index;
}

function parseBarsBlockElse(mode, tree, index, length, buffer, indent, close) {

    if (buffer[index + 1] !== '{') {
        throw new SyntaxError('Unexpected end of input.');
    }

    var ch,
        name = '',
        endChars = 0;

    // move past {{
    index += 2;

    loop: for (; index < length; index++) {
        ch = buffer[index];

        if (ch === '}') {
            endChars++;
            index++;

            for (; index < length; index++) {
                ch = buffer[index];

                if (ch === '}') {
                    endChars++;
                } else {
                    throw new SyntaxError('Unexpected character: expected \'}\' but found \'' +ch+ '\'.');
                }

                if (endChars === 2) {
                    break loop;
                }
            }
        }
        name += ch;
    }

    if (close && close.type === 'BLOCK-NODE' && name === 'else') {
        if (close.elsed) {
            throw new SyntaxError('Unexpected else token.');
        }

        close.elsed = true;

        console.log(indent+'parseBarsBlockElse');
        return index;
    } else if (!close) {
        throw new SyntaxError('Unexpected else tag.');
    } else {
        /* Canceling Parse */
        return null;
    }
}

function compile(buffer) {
    var tree = {
        type: 'FRAG-NODE',
        nodes: []
    };

    console.log('compile');

    parse('DOM-MODE', tree.nodes, 0, buffer.length, buffer, '  ', null);

    console.log('compiled');

    return tree;
    // return JSON.stringify(tree, null, 2);
}

module.exports = compile;
