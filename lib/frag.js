var Generator = require('generate-js'),
    TYPES = require('./compiler/token-types'),
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

function pathSpliter(path) {
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
}


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

        var newPath = _.path.slice();
        newPath.push(path);
        frag.context.path = newPath;

        _.appendChild(frag);
    },

    _update: function _update(context) {
        var _ = this,
            con,
            arg,
            i;

        if (typeof _.bars.blocks[_.name] === 'function') {
            arg = execute(_.arg, _.bars.transforms, context);
            // console.log('>>>>', arg);
            con = _.bars.blocks[_.name].call(_, arg);
        } else {
            throw new Error('Block helper not found: ' + _.name);
        }

        if (con) {
            if (!_.nodes.length) {
                _.createFragment('');
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
    _update: function _update(data) {
        var _ = this;

        if (!_.partial) {
            var partial = _.bars.partials[_.name];

            if (partial && typeof partial === 'object') {
                _.partial = new Nodes.FRAG(_.fragment, _.bars,
                    partial.struct);
                _.partial.parent = _;
                _.partial.context.path = _.path;
            } else {
                throw new Error('Partial not found: ' + _.name);
            }
        }
        _.partial.update(data);
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
        // _.context.data = null;
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
