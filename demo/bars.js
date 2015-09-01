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
        },
        partials: {},
        helpers: {}
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

    registerPartial: function registerPartial(name, template) {
        var _ = this;

        _.partials[name] = _.compile(template);
    },

    registerHelper: function registerHelper(name, func) {
        var _ = this;

        _.helpers[name] = func;
    },
});

module.exports = window.Bars = Bars;

},{"./fragment":3,"./nodes":10,"./parser":16,"generate-js":17}],3:[function(require,module,exports){
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
            node,
            helper;

        struct = struct || _.struct;

        if (struct.type === 'BLOCK-NODE') {
            node = _.bars.blocks[struct.name].create({
                blockString: struct.blockString,
                nodesFrag: Fragment.create(_.bars, struct.nodesFrag),
                alternateFrag: Fragment.create(_.bars, struct.alternateFrag),
                bars: _.bars
            });
        } else if (struct.type === 'PARTIAL-NODE') {
            node = _.bars.partials[struct.name];

            if (!node) {
                throw new Error('Partial not found: ' + struct.name);
            }

            node = node.render();
        } else {
            node = Nodes[struct.type].create({
                contextPath: struct.contextPath,
                content: struct.content,
                name: struct.name,
                bars: _.bars,
                blockString: struct.blockString
            });

            if (struct.nodes) {
                for (i = 0; i < struct.nodes.length; i++) {
                    node.appendChild( _.build(struct.nodes[i]) );
                }
            }
        }

        if (struct.type === 'TAG-NODE' && struct.attrs) {
            for (i = 0; i < struct.attrs.length; i++) {
                node.addAttr( _.build(struct.attrs[i]) );
            }
        }

        return node;
    }
});

module.exports = Fragment;

},{"./nodes":10,"generate-js":17}],4:[function(require,module,exports){
module.exports = require('./bars');

},{"./bars":2}],5:[function(require,module,exports){
var Node = require('./node');

var AttrNode = Node.generate(function AttrNode(options) {
    var _ = this;

    _.supercreate(options);

    _.defineProperties({
        $el: document.createElement('X-BARS'),
    });
    // _.value = true;
});

AttrNode.definePrototype({
    isDOM: true,
    type: 'ATTR-NODE',
    update: function(context) {
        var _ = this,
            i;
        for (i = 0; i < _.nodes.length; i++) {
            _.nodes[i].update(context);
        }

        _._elementAppendTo(_.$parent);
    },
    _elementAppendTo: function _elementAppendTo(parent) {
        var _ = this;

        if (parent instanceof Element) {
            _.$parent = parent;
            _.$parent.setAttribute(_.name, _.$el.innerHTML);

        }
    },
    _elementRemove: function _elementRemove() {
        var _ = this;

        if (_.$parent instanceof Element) {
            _.$parent.removeAttribute(_.name);
        }
    }
});

module.exports = AttrNode;

},{"./node":11}],6:[function(require,module,exports){
var Node  = require('./node');

var BlockNode = Node.generate(function BlockNode(options) {
    var _ = this;

    _.supercreate(options);

    _.con = false;
});

BlockNode.definePrototype({
    type: 'BLOCK-NODE',

    update: function(context) {
        var _ = this,
            node,
            lastCon = _.con;

        _.con = _.condition(context);

        if (_.con) {
            if (_.nodes[0]) {
                _.nodes[0].update(context);
            } else {
                node = _.nodesFrag.render(context);

                _.appendChild(node);

                node._elementAppendTo(_.$parent);
            }
        } else {
            if (_.alternate) {
                _.alternate.update(context);
            } else {
                _.alternate = _.alternateFrag.render(context);
                _.alternate.parent = _;
            }
        }

        if ((!_.con && lastCon) || (_.con && !lastCon)) {
            _._elementAppendTo(_.$parent);
        }
    },

    condition: function condition(context) {
        var _ = this;
        return context(_.blockString);
    },
    _elementAppendTo: function _elementAppendTo(parent) {
        var _ = this,
            i;

        if (_.con) {
            for (i = 0; i < _.nodes.length; i++) {
                _.nodes[i]._elementAppendTo(parent);
            }

            if (_.alternate) {
                _.alternate._elementRemove();
            }

            _.$parent = parent;

        } else {

            for (i = 0; i < _.nodes.length; i++) {
                _.nodes[i]._elementRemove();
            }

            if (_.alternate) {
                _.alternate._elementAppendTo(parent);
            }

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

},{"./node":11}],7:[function(require,module,exports){
var BlockNode  = require('./block');

var EachNode = BlockNode.generate(function EachNode(options) {
    var _ = this;

    _.supercreate(options);
});

EachNode.definePrototype({
    name: 'each',

     update: function(context) {
        var _ = this,
            lastCon = _.con,
            node,
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
                        node = _.nodesFrag.render(context.getContext(keys[i]));

                        _.appendChild(node);

                        node._elementAppendTo(_.$parent);

                    }
                }

                for (i = keys.length; i < _.nodes.length; i++) {
                    _.nodes[i].remove();
                }
            } else {
                if (_.alternate) {
                    _.alternate.update(context);
                } else {
                    _.alternate = _.alternateFrag.render(context);
                    _.alternate.parent = _;
                }
                _.con = false;
            }
        } else {
            if (_.alternate) {
                _.alternate.update(context);
            } else {
                _.alternate = _.alternateFrag.render(context);
                _.alternate.parent = _;
            }
            _.con = false;
        }

        if ((!_.con && lastCon) || (_.con && !lastCon)) {
            _._elementAppendTo(_.$parent);
        }
    },
});

module.exports = EachNode;

},{"./block":6}],8:[function(require,module,exports){
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
            context,
            helper,
            args,
            content;

        if (typeof data === 'function') {
            context = data;
        } else {
            _.data = data;
            context = _.getContext('');
        }

        if (_.name) {
            _.empty();
            helper = _.bars.helpers[_.name];

            if (typeof helper === 'function') {
                args = _.blockString.split(/\d+/).map(function(item) {
                    return context(item);
                });

                content = helper.apply(_, args);
                content = _.bars.compile(content).render();

                _.appendChild(content);
                content.update(context);
            } else {
                throw new Error('Helper not found: ' + _.name);
            }
        } else if (_.contextPath) {
            _.empty();
            content = context(_.contextPath);
            content = _.bars.compile(content).render();
            _.appendChild(content);
            content.update(context);
        } else {
            for (var i = 0; i < _.nodes.length; i++) {
                _.nodes[i].update(context);
            }
        }
    },

    _elementAppendTo: function _elementAppendTo(parent) {
        var _ = this;

        _.$parent = parent;

        for (var i = 0; i < _.nodes.length; i++) {
            _.nodes[i]._elementAppendTo(parent);
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

},{"./node":11}],9:[function(require,module,exports){
var BlockNode  = require('./block');

var IfNode = BlockNode.generate(function IfNode(options) {
    var _ = this;

    _.supercreate(options);
});

IfNode.definePrototype({
    name: 'if'
});

module.exports = IfNode;

},{"./block":6}],10:[function(require,module,exports){
exports['TAG-NODE']    = require('./tag');
exports['ATTR-NODE']   = require('./attr');
exports['TEXT-NODE']   = require('./text');

exports['FRAG-NODE']   = require('./frag');

exports['IF-NODE']     = require('./if');
exports['UNLESS-NODE'] = require('./unless');
exports['EACH-NODE']   = require('./each');
exports['WITH-NODE']   = require('./with');

},{"./attr":5,"./each":7,"./frag":8,"./if":9,"./tag":12,"./text":13,"./unless":14,"./with":15}],11:[function(require,module,exports){
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

        if (_.isDOM || _.type === 'TEXT-NODE' && _.parentTag) {
            _.parentTag.prevDom = _.$el;
        }

        _.content = context(_.contextPath);
    },
    getParentTag: function getParentTag() {
        var _ = this,
            parent = _.parent || null;

        while (parent && parent.type !== 'TAG-NODE') {
            parent = parent.parent;
        }

        return parent;
    },
    empty: function empty() {
        var _ = this;

        for (var i = _.nodes.length - 1; i >= 0; i--) {
            _.nodes[i].remove();
        }
    },
    isDom: function isDom() {
        var _ = this;
        return _.type === 'TEXT-NODE' || _.type === 'TAG-NODE';
    },
    appendChild: function appendChild(child) {
        var _ = this;

        _.nodes.push(child);

        child.parent = _;
        child.parentTag = _.getParentTag();

        child._elementAppendTo(_.$el);
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
            var prev = _.parentTag && _.parentTag.prevDom;

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
            content: _.content,
            contextPath: _.contextPath,
            alternate: _.alternate,
            nodes: _.nodes.length ? _.nodes : void(0)
        };
    },
});

module.exports = Node;

},{"generate-js":17}],12:[function(require,module,exports){
var Node = require('./node');

var TagNode = Node.generate(function TagNode(options) {
    var _ = this;

    _.supercreate(options);

    _.defineProperties({
        $el: document.createElement(options.name),
        attrs: []
    });
});

TagNode.definePrototype({
    isDOM: true,
    type: 'TAG-NODE',
    update: function update(context) {
        var _ = this, i;

        //self
        for (i = 0; i < _.attrs.length; i++) {
            _.attrs[i].update(context);
        }

        //then children
        for (i = 0; i < _.nodes.length; i++) {
            _.nodes[i].update(context);
        }
    },
    addAttr: function addAttr(child) {
        var _ = this;

        _.attrs.push(child);
        child._elementAppendTo(_.$el);

        child.parent = _;
        child.parentTag = _.getParentTag();

    },
});

module.exports = TagNode;

},{"./node":11}],13:[function(require,module,exports){
var Node = require('./node');

var TextNode = Node.generate(function TextNode(options) {
    var _ = this;

    _.supercreate(options);

    _.defineProperties({
        $el: document.createTextNode(options && options.content)
    });
});

TextNode.definePrototype({
    type: 'TEXT-NODE',

    update: function update(context) {
        var _ = this,
            helper,
            args,
            content;

        if (_.name) {
            helper = _.bars.helpers[_.name];

            if (typeof helper === 'function') {
                args = _.blockString.split(/\d+/).map(function(item) {
                    return context(item);
                });

                content = helper.apply(_, args);
            } else {
                throw new Error('Helper not found: ' + _.name);
            }
        } else if (_.contextPath) {
            content = context(_.contextPath);
        } else {
            content = _.content;
        }

        if (_.isDOM || _.type === 'TEXT-NODE' && _.parentTag) {
            _.parentTag.prevDom = _.$el;
        }

        _.$el.textContent = content;
    },
});

module.exports = TextNode;

},{"./node":11}],14:[function(require,module,exports){
var BlockNode  = require('./block');

var UnlessNode = BlockNode.generate(function UnlessNode(options) {
    var _ = this;

    _.supercreate(options);
});

UnlessNode.definePrototype({
    name: 'unless',

    condition: function condition(context) {
        var _ = this;
        return !context(_.blockString);
    },
});

module.exports = UnlessNode;

},{"./block":6}],15:[function(require,module,exports){
var BlockNode  = require('./block');

var WithNode = BlockNode.generate(function WithNode(options) {
    var _ = this;

    _.supercreate(options);
});

WithNode.definePrototype({
    name: 'with',

    update: function(context) {
        var _ = this,
            node,
            lastCon = _.con,
            data = context(_.blockString);

        if (typeof data === 'object') {
            _.con = true;
            context = context.getContext(_.blockString);
        } else {
            _.con = false;
        }

        if (_.con) {
            if (_.nodes[0]) {
                _.nodes[0].update(context);
            } else {
                node = _.nodesFrag.render(context);

                _.appendChild(node);

                node._elementAppendTo(_.$parent);
            }
        } else {
            if (_.alternate) {
                _.alternate.update(context);
            } else {
                _.alternate = _.alternateFrag.render(context);
                _.alternate.parent = _;
            }
        }

        if ((!_.con && lastCon) || (_.con && !lastCon)) {
            _._elementAppendTo(_.$parent);
        }

        _._elementAppendTo(_.$parent);
    },
});

module.exports = WithNode;

},{"./block":6}],16:[function(require,module,exports){
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
        '{', parseBarsHelperHTML,
        '{', parseBarsInsertHTML,
        '{', parseBarsComment,
        '{', parseBarsHelper,
        '{', parseBarsPartial,
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
        '{',  parseBarsHelper,
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
                    content: ''
                };
                for (; index < length; index++) {
                    ch = buffer[index];

                    if (!VALID_IDENTIFIER.test(ch)) {
                        break;
                    }

                    textValueToken.content += ch;
                }

                if (textValueToken.content) {
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
            content: ''
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

            textToken.content += ch;
        }

        if (textToken.content) {
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
            content: ''
        };

    for (; index < length; index++) {
        ch = buffer[index];

        if (ch === '<' || ch === '{') {
            index--;
            break;
        }

        token.content += ch;
    }

    if (token.content) {
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
            content: ''
        };

    for (; index < length; index++) {
        ch = buffer[index];

        if (ch === '{' || (close && ch === close.name && buffer[index - 1] !== '\\')) {
            index--;
            break;
        }

        token.content += ch;
    }

    if (token.content) {
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
            contextPath: ''
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
        token.contextPath += ch;
    }

    tree.push(token);

    return index;
}

function parseBarsInsertHTML(mode, tree, index, length, buffer, indent) {
    console.log(indent+'parseBarsInsert');

    if (buffer[index + 1] !== '{') {
        return null;
    }

    if (buffer[index + 2] !== '{') {
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

                if (endChars === 3) {
                    break loop;
                }
            }
        }

        token.contextPath += ch;
    }

    tree.push(token);

    return index;
}

function parseBarsPartial(mode, tree, index, length, buffer, indent) {
    if (buffer[index + 1] !== '{') {
        return null;
    }

    if (buffer[index + 2] !== '>') {
        return null;
    }

    var ch,
        token = {
            type: 'PARTIAL-NODE',
            name: ''
        }, endChars = 0;

    // move past {{>
    index+=3;
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
        token.name += ch;
    }

    token.name = token.name.trim();

    if (!token.name) {
        throw new SyntaxError('Unexpected end of input.');
    }

    console.log(indent+'parseBarsPartial');

    tree.push(token);

    return index;
}

function parseBarsHelper(mode, tree, index, length, buffer, indent) {
    if (buffer[index + 1] !== '{') {
        return null;
    }

    if (buffer[index + 2] !== '?') {
        /* Canceling Parse */
        return null;
    }
    console.log(indent+'parseBarsHelper');

    var ch,
        token = {
            type: 'TEXT-NODE',
            name: '',
            blockString: ''
        }, endChars = 0;

    // move past {{?
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

    tree.push(token);

    return index;
}

function parseBarsHelperHTML(mode, tree, index, length, buffer, indent) {
    if (buffer[index + 1] !== '{') {
        return null;
    }

    if (buffer[index + 2] !== '{') {
        /* Canceling Parse */
        return null;
    }

    if (buffer[index + 3] !== '?') {
        /* Canceling Parse */
        return null;
    }
    console.log(indent+'parseBarsHelperHTML');

    var ch,
        token = {
            type: 'FRAG-NODE',
            name: '',
            blockString: ''
        }, endChars = 0;

    // move past {{{?
    index += 4;

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

                if (endChars === 3) {
                    break loop;
                }
            }
        }

        token.blockString += ch;
    }

    token.blockString = token.blockString.trim();

    tree.push(token);

    return index;
}

function parseBarsComment(mode, tree, index, length, buffer, indent) {
    if (buffer[index + 1] !== '{') {
        return null;
    }

    if (buffer[index + 2] !== '!') {
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
        token.comment += ch;
    }

    // TODO: Maybe create comment node?
    // if (token.comment) {
    //     console.log(indent+'parseBarsComment');

    //     tree.push(token);

    //     return index;
    // }

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
    } else if (!close && name === 'else') {
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

},{}],17:[function(require,module,exports){
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
