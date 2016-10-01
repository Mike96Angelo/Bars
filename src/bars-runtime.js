(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var Generator = require('generate-js'),
    Renderer = require('./renderer'),
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
        var _ = this;
        return new Renderer(_, parsedTemplate);
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

},{"../package":12,"./blocks":2,"./renderer":5,"./transforms":10,"generate-js":11}],2:[function(require,module,exports){
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

},{"generate-js":11}],3:[function(require,module,exports){
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

},{}],4:[function(require,module,exports){
var Generator = require('generate-js'),
    execute = require('./runtime/execute'),
    utils = require('./runtime/utils'),
    Context = require('./runtime/context'),

    pathSpliter = utils.pathSpliter,
    findPath = utils.findPath,

    Nodes = {},

    TYPES = require('./compiler/token-types'),
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
        arg: struct.argument,
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

            if (!_.alternate) {
                _.alternate = new Nodes.FRAG(_.fragment, _.bars, _
                    .altFrag || {});
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

},{"./compiler/token-types":3,"./runtime/context":6,"./runtime/execute":7,"./runtime/utils":9,"generate-js":11}],5:[function(require,module,exports){
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

},{"./frag":4,"generate-js":11}],6:[function(require,module,exports){
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

            path = pathSpliter(path);
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
        var _ = this;

        path = pathSpliter(path);

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
            path[0] === '~'
        ) {
            path.shift();
        }

        if (!_.data && _.context) {
            _.data = _.context.lookup(_.path);
        }

        if (!_.data) return;

        var value = _.data;

        for (var i = 0; value && i < path.length; i++) {

            if (path[i][0] === '@') {
                value = _.props[path[i].slice(1)];
            } else if (value !== null && value !== void(0)) {
                value = value[path[i]];
            } else {
                value = undefined;
            }
        }

        return value;
    }
});

module.exports = Context;

},{"./utils":9,"generate-js":11}],7:[function(require,module,exports){
var TYPES = require('../compiler/token-types');
var logic = require('./logic');

function execute(syntaxTree, transforms, context) {
    function run(token) {
        var result,
            args = [];

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
                throw 'Missing Transfrom: "' + token.name + '".';
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

},{"../compiler/token-types":3,"./logic":8}],8:[function(require,module,exports){
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

},{}],9:[function(require,module,exports){
var TYPES = require('../compiler/token-types');

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
        if (arg.type === TYPES.INSERT_VAL) {
            return arg.path;
        } else if (arg.type === TYPES.UNARY_EXPRESSION) {
            return findPath(arg.argument);
        } else if (arg.type === TYPES.BINARY_EXPRESSION) {
            var left = findPath(arg.left);
            if (left.type === TYPES.INSERT_VAL) {
                return left.argument;
            }
            var right = findPath(arg.right);
            if (right.type === TYPES.INSERT_VAL) {
                return right.argument;
            }
        } else if (arg.type === TYPES.TRANSFORM) {
            for (var i = 0; i < arg.arguments.length; i++) {
                var argI = findPath(arg.arguments[i]);
                if (argI.type === TYPES.INSERT_VAL) {
                    return argI.argument;
                }
            }
        }
    }

    return '';
}

exports.findPath = findPath;

},{"../compiler/token-types":3}],10:[function(require,module,exports){
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

},{"generate-js":11}],11:[function(require,module,exports){
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
             * @param {Generator} ParentGenerator Generator to inherit from.
             * @param {Function} create           Create method that gets called when creating a new instance of new generator.
             * @return {Generator}                New Generator that inherits from 'ParentGenerator'.
             */
            toGenerator: function toGenerator(extendFrom, create) {
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
                        constructor: construct,
                        generator: construct,
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

},{}],12:[function(require,module,exports){
module.exports={
  "name": "bars",
  "version": "0.3.7",
  "description": "Client-side html templating system that emits DOM.  The templates can be updated with new data without re-writing the DOM.",
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
    "generate-js": "^3.1.1"
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

},{}]},{},[1]);
