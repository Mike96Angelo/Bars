(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports = require('./lib');

},{"./lib":4}],2:[function(require,module,exports){
var Generator = require('generate-js'),
    Fragment = require('./fragment'),
    Parser = require('./parser'),
    Nodes = require('./nodes');

var Bars = Generator.generate(function Bars() {
    var _ = this;

    _.defineProperties({
        blocks: {
            if: Nodes['IF-NODE'],
            unless: Nodes['UNLESS-NODE'],
            each: Nodes['EACH-NODE'],
            with: Nodes['WITH-NODE'],
        }
    });
});

Bars.definePrototype({
    compile: function compile(template) {
        var _ = this,
            parsed = Parser(template);

        console.log(parsed);

        return Fragment.create(_, parsed );
    },

    registerBlock: function registerBlock(name, block) {
        var _ = this;

        _.blocks[name] = block;
    },
});

module.exports = window.Bars = Bars;

},{"./fragment":3,"./nodes":9,"./parser":15,"generate-js":16}],3:[function(require,module,exports){
var Generator = require('generate-js'),
    Nodes = window.Nodes = require('./nodes');

var Fragment = Generator.generate(function Fragment(bars, struct) {
    var _ = this;

    _.defineProperties({
        bars: bars,
        struct: struct
    });
});

Fragment.definePrototype({
    render: function render(data) {
        var _ = this,
            dom = _.build();

        if (data) dom.update(data);

        return dom;
    },

    build: function build(struct) {
        var _ = this,
            i,
            node;

        struct = struct || _.struct;

        if (struct.type === 'BLOCK-NODE') {
            node = _.bars.blocks[struct.name].create({
                blockString: struct.blockString,
                nodesFrag: Fragment.create(_.bars, struct.nodesFrag),
                alternateFrag: Fragment.create(_.bars, struct.alternateFrag),
            });
        } else {
            node = Nodes[struct.type].create({
                contextMap: struct.contextMap,
                staticMap: struct.staticMap,
                name: struct.name
            });

            if (struct.nodes) {
                for (i = 0; i < struct.nodes.length; i++) {
                    node.appendChild( _.build(struct.nodes[i]) );
                }
            }
        }

        return node;
    }
});

module.exports = Fragment;

},{"./nodes":9,"generate-js":16}],4:[function(require,module,exports){
require('./bars');

},{"./bars":2}],5:[function(require,module,exports){
var Node  = require('./node');

var BlockNode = Node.generate(function BlockNode(options) {
    var _ = this;

    _.supercreate(options);

    _.defineProperties({
        alternate: _.alternateFrag.render()
    });

    _.con = true;

    _.appendChild(_.nodesFrag.render());
});

BlockNode.definePrototype({
    type: 'BLOCK-NODE',

    update: function(context) {
        var _ = this,
            i;

        _.con = _.condition(context);

        if (_.con) {
            for (i = 0; i < _.nodes.length; i++) {
                _.nodes[i].update(context);
            }
        } else {
            _.alternate.update(context);
        }

        _._elementAppendTo(_.$parent);
    },

    condition: function condition(context) {
        var _ = this;
        return eval(_.blockString);
    },
    _elementAppendTo: function _elementAppendTo(parent) {
        var _ = this,
            i;

        if (_.con) {
            for (i = 0; i < _.nodes.length; i++) {
                _.nodes[i]._elementAppendTo(parent);
            }

            _.alternate._elementRemove();

            _.$parent = parent;

        } else {
            for (i = 0; i < _.nodes.length; i++) {
                _.nodes[i]._elementRemove();
            }

            _.alternate._elementAppendTo(parent);

            _.$parent = parent;
        }
    },
    _elementRemove: function _elementRemove() {
        var _ = this,
            i;

        for (i = 0; i < _.nodes.length; i++) {
            _.nodes[i]._elementRemove();
        }

        _.alternate._elementRemove();

        _.$parent = null;

    }

});

module.exports = BlockNode;

},{"./node":10}],6:[function(require,module,exports){
var BlockNode  = require('./block');

var EachNode = BlockNode.generate(function EachNode(options) {
    var _ = this;

    _.supercreate(options);
});

EachNode.definePrototype({
    name: 'each',

    condition: function condition(context) {
        var _ = this;

        return context(_.blockString).length;
    },

     update: function(context) {
        var _ = this,
            i,
            data = context(_.blockString);

            context = context.getContext(_.blockString);

        if (typeof data === 'object') {
            var keys = Object.keys(data);

            if (keys.length) {
                _.con = true;

                for (i = 0; i < keys.length; i++) {
                    if (_.nodes[i]) {
                        _.nodes[i].update(context.getContext(keys[i]));
                    } else {
                        _.appendChild(_.nodesFrag.render(context.getContext(keys[i])));
                    }
                }

                for (i = data.length; i < _.nodes.length; i++) {
                    _.nodes[i].remove();
                }
            } else {
                _.alternate.update(context);
                _.con = false;
            }
        } else {
            _.alternate.update(context);
            _.con = false;
        }

        _._elementAppendTo(_.$parent);
    },
});

module.exports = EachNode;

},{"./block":5}],7:[function(require,module,exports){
var Node = require('./node');

function resolve(basepath, path) {
    var splitBasepath = basepath.split('/'),
        splitPath = path.split('/');

    if (path[0] === '/') {
        splitPath.shift();
        return splitPath;
    }

    if (!basepath || basepath[0] === '/') {
        splitBasepath.shift();
    }

    while (splitPath[0] =='..') {
        splitPath.shift();
        splitBasepath.pop();
    }

    return splitBasepath.concat(splitPath);
}

/**
 * <span>hello, {{name}}.</span>
 */

var FragNode = Node.generate(function FragNode(options) {
    var _ = this;

    _.supercreate(options);

    _.data = {};
});

FragNode.definePrototype({
    type: 'FRAG-NODE',

    update: function update(data) {
        var _ = this,
            context;

        if (typeof data === 'function') {
            context = data;
        } else {
            _.data = data;
            context = _.getContext('');
        }

        for (var i = 0; i < _.nodes.length; i++) {
            _.nodes[i].update(context);
        }
    },

    _elementAppendTo: function _elementAppendTo(parent) {
        var _ = this;

        for (var i = 0; i < _.nodes.length; i++) {
            _.nodes[i]._elementAppendTo(parent);
            _.$parent = parent;
        }
    },

    _elementRemove: function _elementRemove() {
        var _ = this;

        for (var i = 0; i < _.nodes.length; i++) {
            _.nodes[i]._elementRemove();
        }
        _.$parent = null;
    },

    getValue: function getValue(splitPath) {
        var _ = this;

        var value = _.data;

        for (var i = 0; i < splitPath.length; i++) {
            if (splitPath[i] === '@key' || splitPath[i] === '@index') {
                value = splitPath[i - 1];
            } else {
                value = value[splitPath[i]];
            }
        }

        return value;
    },
    getContext: function getContext(basepath) {
        var _ = this;

        function context(path) {
            return _.getValue(resolve(basepath, path));
        }

        context.getContext = function getContext(path) {
            return _.getContext(resolve(basepath, path).join('/'));
        };

        return context;
    },
});

module.exports = FragNode;

},{"./node":10}],8:[function(require,module,exports){
var BlockNode  = require('./block');

var IfNode = BlockNode.generate(function IfNode(options) {
    var _ = this;

    _.supercreate(options);
});

IfNode.definePrototype({
    name: 'if'
});

module.exports = IfNode;

},{"./block":5}],9:[function(require,module,exports){

exports['FRAG-NODE']   = require('./frag');
exports['IF-NODE']     = require('./if');
exports['UNLESS-NODE'] = require('./unless');
exports['TEXT-NODE']   = require('./text');
exports['TAG-NODE']    = require('./tag');
exports['EACH-NODE']   = require('./each');
exports['WITH-NODE']   = require('./with');


},{"./each":6,"./frag":7,"./if":8,"./tag":11,"./text":12,"./unless":13,"./with":14}],10:[function(require,module,exports){
var Generator = require('generate-js');

var Node = Generator.generate(function Node(options) {
    var _ = this;

    _.defineProperties({
        nodes: []
    });

    _.defineProperties(options);
});

Node.definePrototype({
    type: 'NODE',
    update: function(context) {
        var _ = this;

        for (var key in _.contextMap) {
            _.$el[key] = context(_.contextMap[key]);
        }
    },
    prevDom: function prevDom() {
        var _ = this;

        if (!_.parent) return;

        var index = _.parent.nodes.indexOf(_);

        var prev = _.parent.nodes[index - 1] || null;

        if (!prev) {
            if (_.parent.type === 'TAG-NODE') {
                return;
            } else {
               return _.parent.prevDom();
            }
        }

        var lastDom = prev.lastDom();

        if (!lastDom) {
            return prev.prevDom();
        }

        return lastDom;

    },
    lastDom: function lastDom() {
        var _ = this;

        if (_.isDom()) {
            return _.$el;
        }

        return _.nodes[_.nodes.length - 1].prevDom();
    },
    isDom: function isDom() {
        var _ = this;
        return _.type === 'TEXT-NODE' || _.type === 'TAG-NODE';
    },
    appendChild: function appendChild(child) {
        var _ = this;

        _.nodes.push(child);
        child._elementAppendTo(_.$el);

        child.parent = _;

    },
    appendTo: function appendTo(parent) {
        var _ = this;

        if (parent instanceof Element) {
            _._elementAppendTo(parent);
        }

        if (Node.isCreation(parent)) {
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
    _elementAppendTo: function _elementAppendTo(parent) {
        var _ = this;

        if (parent instanceof Element && (_.$el instanceof Element || _.$el instanceof Text)) {
            var prev = _.prevDom();

            if (prev) {
                parent.insertBefore(_.$el, prev.nextSibling);
            } else {
                parent.appendChild(_.$el);
            }

            _.$parent = parent;
        }
    },
    _elementRemove: function _elementRemove() {
        var _ = this;

        if ((_.$el instanceof Element || _.$el instanceof Text) && _.$el.parentNode instanceof Element) {
            _.$el.parentNode.removeChild(_.$el);

            _.$parent = null;
        }
    },
    toJSON: function toJSON() {
        var _ = this;

        return {
            type: _.type,
            name: _.name,
            contextMap: _.contextMap,
            staticMap: _.staticMap,
            alternate: _.alternate,
            nodes: _.nodes.length ? _.nodes : void(0)
        };
    },
});

module.exports = Node;

},{"generate-js":16}],11:[function(require,module,exports){
var Node = require('./node');

var TagNode = Node.generate(function TagNode(options) {
    var _ = this;

    _.supercreate(options);

    _.defineProperties({
        $el: document.createElement(options.name),
        attrs: {
            // class: AttrNode()
        }
    });
});

TagNode.definePrototype({
    type: 'TAG-NODE',
    update: function update(data) {
        var _ = this;
        //self

        //then children
        for (var i = 0; i < _.nodes.length; i++) {
            _.nodes[i].update(data);
        }
    },
});

module.exports = TagNode;

},{"./node":10}],12:[function(require,module,exports){
var Node = require('./node');

var TextNode = Node.generate(function TextNode(options) {
    var _ = this;

    _.supercreate(options);

    _.defineProperties({
        $el: document.createTextNode(options.staticMap && options.staticMap.textContent)
    });
});

TextNode.definePrototype({
    type: 'TEXT-NODE',
});

module.exports = TextNode;

},{"./node":10}],13:[function(require,module,exports){
var BlockNode  = require('./block');

var UnlessNode = BlockNode.generate(function UnlessNode(options) {
    var _ = this;

    _.supercreate(options);
});

UnlessNode.definePrototype({
    name: 'unless',

    condition: function condition(context) {
        var _ = this;
        return !eval(_.blockString);
    },
});

module.exports = UnlessNode;

},{"./block":5}],14:[function(require,module,exports){
var BlockNode  = require('./block');

var WithNode = BlockNode.generate(function WithNode(options) {
    var _ = this;

    _.supercreate(options);
});

WithNode.definePrototype({
    name: 'with',

    condition: function condition(context) {
        var _ = this;

        return context(_.blockString).length;
    },

     update: function(context) {
        var _ = this,
            data = context(_.blockString);

            context = context.getContext(_.blockString);

        if (typeof data === 'object') {
            _.con = true;
            _.nodes[0].update(context);
        } else {
            _.alternate.update(context);
            _.con = false;
        }

        _._elementAppendTo(_.$parent);
    },
});

module.exports = WithNode;

},{"./block":5}],15:[function(require,module,exports){
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
    console.log(indent + 'parse');

    tree = tree || [];
    index = index || 0;
    buffer = buffer || '';
    length = length || buffer.length;

    var ch,
        oldIndex,
        oldIndent = indent;

    indent += '  ';

    loop: for (; index < length; index++) {
        ch = buffer[index];

        switch (ch) {
        case '<':
            oldIndex = index;
            index = parseTagClose(tree, index, length, buffer, close, false, indent);
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
            index = parseBarsBlockClose(tree, index, length, buffer, close, false, indent);
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

    console.log(oldIndent + '<<<');

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
        index = parse(token.nodes, index, length, buffer, token, indent);
    }

    if (token.closed) {
        delete token.closed;
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

    console.log(indent+'parseTagClose');

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

    token.blockString = token.blockString.trim();

    index++;
    index = parse(token.nodesFrag.nodes, index, length, buffer, token, indent);

    if (token.elsed && !token.closed) {
        index++;
        index = parse(token.alternateFrag.nodes, index, length, buffer, token, indent);
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

    console.log(indent+'parseBarsBlockClose');


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
        type: 'FRAG-NODE',
        nodes: []
    };

    console.log('compile');

    parse(tree.nodes, 0, buffer.length, buffer, null, '  ');

    console.log('compiled');

    return tree;
    // return JSON.stringify(tree, null, 2);
}

module.exports = compile;

},{}],16:[function(require,module,exports){
/**
 * @name generate.js
 * @author Michaelangelo Jong
 */

(function GeneratorScope() {

// Variables
var Creation = {},
    Generation = {},
    Generator = {};

// Helper Methods

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
        throw new TypeError('Expected \'' + type + '\' but instead found \'' + typeof test +'\'');
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
    var funcNameMatch = func.toString().match(/function\s*([^\s]*)\s*\(/);
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
        keys = Object.getOwnPropertyNames(obj).sort();
        length = keys.length;

        if ((length === 1 && (keys[0] === 'get' && typeof obj.get === 'function' ||
                              keys[0] === 'set' && typeof obj.set === 'function')) ||
            (length === 2 && (keys[0] === 'get' && typeof obj.get === 'function' &&
                              keys[1] === 'set' && typeof obj.set === 'function'))) {
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
        length;

    if (!descriptor || typeof descriptor !== 'object') {
        descriptor = {};
    }

    if (!properties || typeof properties !== 'object') {
        properties = descriptor;
        descriptor = {};
    }

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

// Creation Class
defineObjectProperties(
    Creation,
    {
        configurable: false,
        enumerable: false,
        writable: false
    },
    {
        /**
         * Defines properties on this object.
         * @param  {Object} descriptor Optional object descriptor that will be applied to all attaching properties.
         * @param  {Object} properties An object who's properties will be attached to this object.
         * @return {Object}            This object.
         */
        defineProperties: function defineProperties(descriptor, properties) {
            defineObjectProperties(this, descriptor, properties);
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
            return Object.getPrototypeOf(this.generator).proto;
            // return Object.getPrototypeOf(Object.getPrototypeOf(this));
        }
    }
);

// Generation Class
defineObjectProperties(
    Generation,
    {
        configurable: false,
        enumerable: false,
        writable: false
    },
    {
        name: 'Generation',

        proto: Creation,

        /**
         * Creates a new instance of this Generator.
         * @return {Generator} Instance of this Generator.
         */
        create: function create() {
            var _ = this,
                newObj = Object.create(_.proto);

            _.__supercreate(newObj, arguments);

            return newObj;
        },

        __supercreate: function __supercreate(newObj, args) {
            var _ = this,
                superGenerator = Object.getPrototypeOf(_),
                supercreateCalled = false;

            newObj.supercreate = function supercreate() {

                supercreateCalled = true;

                if (Generation.isGeneration(superGenerator)){
                    superGenerator.__supercreate(newObj, arguments);
                }
            };

            _.__create.apply(newObj, args);

            if (!supercreateCalled) {
                newObj.supercreate();
            }

            delete newObj.supercreate;
        },

        __create: function () {},

        /**
         * Generates a new generator that inherits from `this` generator.
         * @param {Generator} ParentGenerator Generator to inherit from.
         * @param {Function} create           Create method that gets called when creating a new instance of new generator.
         * @return {Generator}                New Generator that inherits from 'ParentGenerator'.
         */
        generate: function generate(create) {
            var _ = this;

            assertError(Generation.isGeneration(_) || _ === Generation, 'Cannot call method \'generate\' on non-Generations.');
            assertTypeError(create, 'function');

            var newGenerator = Object.create(_),
                newProto     = Object.create(_.proto);

            defineObjectProperties(
                newProto,
                {
                    configurable: false,
                    enumerable: false,
                    writable: false
                },
                {
                    generator: newGenerator
                }
            );

            defineObjectProperties(
                newGenerator,
                {
                    configurable: false,
                    enumerable: false,
                    writable: false
                },
                {
                    name: getFunctionName(create),
                    proto: newProto,
                    __create: create
                }
            );

            return newGenerator;
        },

        /**
         * Returns true if 'generator' was generated by this Generator.
         * @param  {Generator} generator A Generator.
         * @return {Boolean}             true or false.
         */
        isGeneration: function isGeneration(generator) {
            var _ = this;
            return _.isPrototypeOf(generator);
        },

        /**
         * Returns true if 'object' was created by this Generator.
         * @param  {Object} object An Object.
         * @return {Boolean}       true or false.
         */
        isCreation: function isCreation(object) {
            var _ = this;
            return _.proto.isPrototypeOf(object);
        },

        /**
         * Defines shared properties for all objects created by this generator.
         * @param  {Object} descriptor Optional object descriptor that will be applied to all attaching properties.
         * @param  {Object} properties An object who's properties will be attached to this generator's prototype.
         * @return {Generator}         This generator.
         */
        definePrototype: function definePrototype(descriptor, properties) {
            defineObjectProperties(this.proto, descriptor, properties);
            return this;
        },

        /**
         * Generator.toString method.
         * @return {String} A string representation of this generator.
         */
        toString: function toString() {
            return '[' + (this.name || 'generation') + ' Generator]';
        }
    }
);

// Generator Class Methods
defineObjectProperties(
    Generator,
    {
        configurable: false,
        enumerable: false,
        writable: false
    },
    {
        /**
         * Generates a new generator that inherits from `this` generator.
         * @param {Generator} ParentGenerator Generator to inherit from.
         * @param {Function} create           Create method that gets called when creating a new instance of new generator.
         * @return {Generator}                New Generator that inherits from 'ParentGenerator'.
         */
        generate: function generate (create) {
            return Generation.generate(create);
        },

        /**
         * Returns true if 'generator' was generated by this Generator.
         * @param  {Generator} generator A Generator.
         * @return {Boolean}             true or false.
         */
        isGenerator: function isGenerator (generator) {
            return Generation.isGeneration(generator);
        },

        /**
         * [toGenerator description]
         * @param  {Function} constructor A constructor function.
         * @return {Generator}            A new generator who's create method is `constructor` and inherits from `constructor.prototype`.
         */
        toGenerator: function toGenerator(constructor) {

            assertTypeError(constructor, 'function');

            var newGenerator = Object.create(Generation),
                newProto     = Object.create(constructor.prototype);

            defineObjectProperties(
                newProto,
                {
                    configurable: false,
                    enumerable: false,
                    writable: false
                },
                {
                    generator: newGenerator
                }
            );

            defineObjectProperties(
                newProto,
                {
                    configurable: false,
                    enumerable: false,
                    writable: false
                },
                Creation
            );

            defineObjectProperties(
                newGenerator,
                {
                    configurable: false,
                    enumerable: false,
                    writable: false
                },
                {
                    name: getFunctionName(constructor),
                    proto: newProto,
                    __create: constructor
                }
            );

            return newGenerator;
        }
    }
);

Object.freeze(Creation);
Object.freeze(Generation);
Object.freeze(Generator);

// Exports
if (typeof define === 'function' && define.amd) {
    // AMD
    define(function() {
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

},{}]},{},[1]);
