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
        helpers: {
            log: function log() {
                console.log.apply(console, arguments);
            }
        }
    });
});

Bars.definePrototype({
    compile: function compile(template) {
        var _ = this,
            parsed = Parser(template);

        console.log(parsed);

        //here

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

    build: function build(struct, parent) {
        var _ = this,
            i,
            node;

        struct = struct || _.struct;

        if (struct.type === 'BLOCK-NODE') {
            node = _.bars.blocks[struct.name].create({
                blockString: struct.blockString,
                nodesFrag: Fragment.create(_.bars, struct.nodesFrag),
                altFrag: Fragment.create(_.bars, struct.altFrag),
                bars: _.bars
            });

            if (parent) {
                parent.appendChild(node);
            }
        } else if (struct.type === 'PARTIAL-NODE') {
            node = _.bars.partials[struct.name];

            if (!node) {
                throw new Error('Partial not found: ' + struct.name);
            }

            node = node.render();
            node.setPath(struct.blockString);

            if (parent) {
                parent.appendChild(node);
            }
        } else {
            node = Nodes[struct.type].create({
                contextPath: struct.contextPath,
                content: struct.content,
                name: struct.name,
                bars: _.bars,
                blockString: struct.blockString
            });

            if (parent) {
                parent.appendChild(node);
            }

            if (struct.nodes) {
                for (i = 0; i < struct.nodes.length; i++) {
                    _.build(struct.nodes[i], node);
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
                _.alternate = _.altFrag.render(context);
                _.alternate.parent = _;
                _.alternate.parentTag = _.alternate.getParentTag();
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

        if (_.alternate) {
            _.alternate._elementRemove();
        }

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
                    _.alternate = _.altFrag.render(context);
                    _.alternate.parent = _;
                    _.alternate.parentTag = _.alternate.getParentTag();

                }
                _.con = false;
            }
        } else {
            if (_.alternate) {
                _.alternate.update(context);
            } else {
                _.alternate = _.altFrag.render(context);
                _.alternate.parent = _;
                _.alternate.parentTag = _.alternate.getParentTag();
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
    var newSplitpath;

    if (path[0] === '/') {
        newSplitpath = path.split('/');
    } else {
        newSplitpath = basepath.split('/').concat(path.split('/'));
    }


    for (var i = 0; i < newSplitpath.length; i++) {
        if (newSplitpath[i] === '.' || newSplitpath[i] === '') {
            newSplitpath.splice(i, 1);
            i--;
        } else if (newSplitpath[i] === '..') {
            newSplitpath.splice(i - 1, 2);
            i -= 2;
        }
    }

    // console.log(newSplitpath);
    return newSplitpath;
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

        if (_.path) {
            context = context.getContext(_.path);
        }

        if (_.name) {
            _.empty();
            helper = _.bars.helpers[_.name];

            if (typeof helper === 'function') {
                args = _.blockString.split(/\s+/).map(function(item) {
                    return context(item);
                });
                content = helper.apply(_, args);

                if (content === null || content === void(0)) {
                    content = '';
                } else {
                    content = '' + content;
                }

                content = _.bars.compile(content).render(context);

                _.appendChild(content);
            } else {
                throw new Error('Helper not found: ' + _.name);
            }
        } else if (_.contextPath) {
            _.empty();
            content =  context(_.contextPath);

            if (content === null || content === void(0)) {
                content = '';
            } else {
                content = '' + content;
            }

            content = _.bars.compile(content).render(context);
            _.appendChild(content);
            _._elementAppendTo(_.$parent);
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
            } else if (value !== null && value !== void(0)) {
                value = value[splitPath[i]];
            } else {
                return;
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

    setPath: function setPath(path) {
        var _ = this;

        _.defineProperties({
            path: path
        });
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
            parent = _.parent,
            oldParent = parent;

        while (parent && !parent.isDOM) {
            oldParent = parent;
            parent = parent.parent;
        }

        _.parentTag = parent || oldParent;
    },
    empty: function empty() {
        var _ = this;

        for (var i = _.nodes.length - 1; i >= 0; i--) {
            _.nodes[i].remove();
        }
    },
    appendChild: function appendChild(child) {
        var _ = this;

        _.nodes.push(child);

        child.parent = _;
        _.getParentTag();

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
            var prev = null;

            if (!_.parentTag) {
                _.getParentTag();
            }

            if (_.parentTag) {
                prev = _.parentTag.prevDom;
            }

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
                args = _.blockString.split(/\s+/).map(function(item) {
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
                _.alternate = _.altFrag.render(context);
                _.alternate.parent = _;
                _.alternate.parentTag = _.alternate.getParentTag();
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
if (!String.prototype.codePointAt) {
    String.prototype.codePointAt = function (pos) {
        pos = isNaN(pos) ? 0 : pos;
        var str = String(this),
            code = str.charCodeAt(pos),
            next = str.charCodeAt(pos + 1);
        // If a surrogate pair
        if (0xD800 <= code && code <= 0xDBFF && 0xDC00 <= next && next <= 0xDFFF) {
            return ((code - 0xD800) * 0x400) + (next - 0xDC00) + 0x10000;
        }
        return code;
    };
}

if (!Number.isNaN) {
    Number.isNaN = function isNaN(value) {
        return value !== value;
    };
}

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

function throwError(buffer, index, message) {
    var lines = 1,
        columns = 0;

    for (var i = 0; i < index; i++) {
        if (buffer.codePointAt(i) === 10 /*'\n'*/) {
            lines++;
            columns = 1;
        } else {
            columns++;
        }
    }

    throw new SyntaxError(message + ' at ' + lines + ':' + columns);
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
            altFrag: {
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
        index = parse(mode, token.altFrag.nodes, index, length, buffer, indent, token);
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
