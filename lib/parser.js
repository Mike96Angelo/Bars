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

function parse(tree, index, length, buffer, close, indent) {
    console.log(indent+'parse');
    indent += '  ';
    tree = tree || [];
    index = index || 0;
    buffer = buffer || '';
    length = length || buffer.length;

    var ch,
        oldIndex;

    loop: for (; index < length; index++) {
        ch = buffer[index];

        switch (ch) {
        case '<':
            oldIndex = index;
            index = parseTagClose(tree, index, length, buffer, close, indent);
            if (close && close.closed) {
                break loop;
            }
            if (oldIndex !== index || index >= length) break;
            /*falls through*/
        case '<':
            oldIndex = index;
            index = parseTag(tree, index, length, buffer, indent);
            if (oldIndex !== index || index >= length) break;
            /*falls through*/
        case '{':
            oldIndex = index;
            var oldElsed = close && close.elsed;
            index = parseBarsBlockElse(tree, index, length, buffer, close, indent);
            if (close && close.elsed && !oldElsed) {
                break loop;
            }
            if (oldIndex !== index || index >= length) break;
            /*falls through*/
        case '{':
            oldIndex = index;
            index = parseBarsBlockClose(tree, index, length, buffer, close, indent);
            if (close && close.closed) {
                break loop;
            }
            if (oldIndex !== index || index >= length) break;
            /*falls through*/
        case '{':
            oldIndex = index;
            index = parseBarsBlock(tree, index, length, buffer, indent);
            if (oldIndex !== index || index >= length) break;
            /*falls through*/
        case '{':
            oldIndex = index;
            index = parseBarsInsert(tree, index, length, buffer, indent);
            if (oldIndex !== index || index >= length) break;
            /*falls through*/
        default:
            index = parseText(tree, index, length, buffer, indent);
        }
    }

console.log(indent+'<<<');
    return index;
}
var validTagName = /^[_A-Za-z0-9-]$/;
function parseTag(tree, index, length, buffer, indent) {
    console.log(indent+'parseTag');
    tree = tree || [];
    index = index || 0;
    buffer = buffer || '';
    length = length || buffer.length;

    var ch,
        token = {
            type: 'TAG-NODE',
            name: '',
            nodes: []
        },
        nameDone = false,
        end = false;

    index++; // move past <
    /* Get Name */
    for (; index < length; index++) {
        ch = buffer[index];

        if (!nameDone && validTagName.test(ch)) {
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
                index = parseTagClose(tree, index, length, buffer, token, true, indent);

                if (token.closed) {
                    // delete token.closed;
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
        index = parse(token.nodes, index, length, buffer, token, indent);
    }

    if (token.closed) {
        // delete token.closed;
        tree.push(token);
    } else {
        throw new SyntaxError('Missing closing tag: expected \'' + token.name + '\'.');
    }


    return index;
}

function parseTagClose(tree, index, length, buffer, close, noErrorOnMismatch, indent) {
    tree = tree || [];
    index = index || 0;
    buffer = buffer || '';
    length = length || buffer.length;

    if (buffer[index + 1] !== '/') return index;

    console.log(indent+'parseTagClose', noErrorOnMismatch);
    var ch,
        token = {
            type: 'TAG-NODE',
            name: ''
        },
        nameDone = false,
        oldIndex = index,
        end = false;

    index+=2; // move past </
    /* Get Name */
    for (; index < length; index++) {
        ch = buffer[index];

        if (!nameDone && validTagName.test(ch)) {
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
        return oldIndex;
    } else {
        throw new SyntaxError('Mismatched closing tag: expected \'' +close.name+ '\' but found \'' +token.name+ '\'.');
    }

    return index;
}

function parseText(tree, index, length, buffer, indent) {
    tree = tree || [];
    index = index || 0;
    buffer = buffer || '';
    length = length || buffer.length;

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
    }

    return index;
}

function parseBarsInsert(tree, index, length, buffer, indent) {
    console.log(indent+'parseBarsInsert');
    tree = tree || [];
    index = index || 0;
    buffer = buffer || '';
    length = length || buffer.length;

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

function parseBarsBlock(tree, index, length, buffer, indent) {
    tree = tree || [];
    index = index || 0;
    buffer = buffer || '';
    length = length || buffer.length;

    if (buffer[index + 1] !== '{') {
        throw new SyntaxError('Unexpected end of input.');
    }

    if (buffer[index + 2] !== '#') {
        return index;
    }
    console.log(indent+'parseBarsBlock');

    var ch,
        token = {
            type: 'BLOCK-NODE',
            name: '',
            blockString: '',
            consequent: {
                type: 'GROUP-NODE',
                nodes: []
            },
            alternate: {
                type: 'GROUP-NODE',
                nodes: []
            }
        }, endChars = 0;

    // move past {{#
    index += 3;

    for (; index < length; index++) {
        ch = buffer[index];

        if (validTagName.test(ch)) {
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

    index++;
    index = parse(token.consequent.nodes, index, length, buffer, token, indent);

    if (token.elsed && !token.closed) {
        index++;
        index = parse(token.alternate.nodes, index, length, buffer, token, indent);
    }

    console.log(token.closed, index, buffer[index], buffer.split('').slice(Math.max(index-2, 0), Math.min(index+3, length)));

    if (token.closed) {
        // delete token.closed;
        // delete token.elsed;
        tree.push(token);
    } else {
        throw new SyntaxError('Missing closing tag: expected \'' + token.name + '\'.');
    }

    return index;
}

function parseBarsBlockClose(tree, index, length, buffer, close, noErrorOnMismatch, indent) {
    tree = tree || [];
    index = index || 0;
    buffer = buffer || '';
    length = length || buffer.length;

    if (buffer[index + 1] !== '{') {
        throw new SyntaxError('Unexpected end of input.');
    }

    if (buffer[index + 2] !== '/') {
        return index;
    }
    console.log(indent+'parseBarsBlockClose', noErrorOnMismatch);


    var ch,
        token = {
            type: 'BLOCK-NODE',
            name: ''
        },
        endChars = 0,
        oldIndex = index;

    // move past {{#
    index += 3;

    for (; index < length; index++) {
        ch = buffer[index];

        if (validTagName.test(ch)) {
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


    console.log(token.type,close.type,token.name,close.name);

    if (token.type === close.type && token.name === close.name) {
        close.closed = true;
    } else if (noErrorOnMismatch) {
        return oldIndex;
    } else {
        throw new SyntaxError('Mismatched closing tag: expected \'' +close.name+ '\' but found \'' +token.name+ '\'.');
    }

    return index;
}

function parseBarsBlockElse(tree, index, length, buffer, close, indent) {
    tree = tree || [];
    index = index || 0;
    buffer = buffer || '';
    length = length || buffer.length;

    if (buffer[index + 1] !== '{') {
        throw new SyntaxError('Unexpected end of input.');
    }

    var ch,
        name = '',
        endChars = 0,
        oldIndex = index;

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
        return oldIndex;
    }
}

function compile(buffer) {
    var tree = {
        type: 'GROUP-NODE',
        nodes: []
    };

    parse(tree.nodes, 0, buffer.length, buffer, null, '');

    console.log('compile');
    return tree;
    // return JSON.stringify(tree, null, 2);
}

module.exports = compile;
