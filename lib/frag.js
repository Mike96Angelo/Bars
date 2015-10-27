var Generator = require('generate-js'),
    Nodes = {},
    ARRAY = [];

/**
 * [BarsNode description]
 * @param {[type]} bars     [description]
 * @param {[type]} struct   [description]
 */
var BarsNode = Generator.generate(function BarsNode(bars, struct) {
    var _ = this;

    _.defineProperties({
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
        text: struct.text,
        args: struct.args,
        conFrag: struct.conFrag,
        altFrag: struct.altFrag,
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

        if (parent instanceof Element && _.isDOM) {
            parent.appendChild(_.$el);
        } else if (_.isDOM) {
            if (!_.parentTag) return;

            parent = _.parentTag.$el || _.parentTag.$parent;

            if (!parent) return;

            var prev = _.prevDom;

            if (prev) {
                parent.insertBefore(_.$el, prev.$el.nextSibling);
            } else {
                parent.appendChild(_.$el);
            }
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
Nodes.TEXT = BarsNode.generate(function TextNode(bars, struct) {
    var _ = this;

    _.supercreate(bars, struct);

    _.defineProperties({
        $el: document.createTextNode(struct.text)
    });
});

Nodes.TEXT.definePrototype({
    isDOM: true,

    appendChild: function appendChild(child) {
        console.warn('appendChild CANNOT be called on TextNodes.');
    },

    _update: function _update(context) {
        var _ = this,
            helper,
            args;

        if (_.name) {
            helper = _.bars.helpers[_.name];

            if (typeof helper === 'function') {
                args = _.args.split(/\s+/).map(function(item) {
                    return context(item);
                });

                _.$el.textContent = helper.apply(_, args);
            } else {
                throw new Error('Helper not found: ' + _.name);
            }
        } else if (typeof _.args === 'string') {
            _.$el.textContent = context(_.args);
        }
    },
});


/**
 * [TagNode description]
 * @param {[type]} bars    [description]
 * @param {[type]} struct  [description]
 */
Nodes.TAG = BarsNode.generate(function TagNode(bars, struct) {
    var _ = this,
        nodes = struct.nodes || ARRAY,
        attrs = struct.attrs || ARRAY,
        i;

    _.supercreate(bars, struct);

    _.defineProperties({
        $el: document.createElement(struct.name),
        attrs: []
    });

    for (i = 0; i < nodes.length; i++) {
        var node = nodes[i];
        _.appendChild(Nodes[node.type].create(bars, node));
    }

    for (i = 0; i < attrs.length; i++) {
        var attr = attrs[i];
        _.addAttr(Nodes[attr.type].create(bars, attr));
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
Nodes.ATTR = BarsNode.generate(function AttrNode(bars, struct) {
    var _ = this,
        nodes = struct.nodes || ARRAY;

    _.supercreate(bars, struct);

    _.defineProperties({
        $el: document.createElement('div'),
    });

    for (var i = 0; i < nodes.length; i++) {
        var node = nodes[i];
        _.appendChild(Nodes[node.type].create(bars, node));
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
Nodes.BLOCK = BarsNode.generate(function BlockNode(bars, struct) {
    var _ = this;

    _.supercreate(bars, struct);
});

Nodes.BLOCK.definePrototype({
    type: 'BLOCK',

    createFragment: function createFragment(path) {
        var _ = this,
            frag = Nodes.FRAG.create(_.bars, _.conFrag);

        frag.setPath(path);

        _.appendChild(frag);
    },

    _update: function _update(context) {
        var _ = this,
            con,
            i;

        if (typeof _.bars.blocks[_.name] === 'function') {
            _.context = context;
            con = _.bars.blocks[_.name].call(_, _.context(_.args));
        } else {
            throw new Error('Block helper not found: ' + _.name);
        }

        if (con) {
            if (!_.nodes.length) {
                _.createFragment();
            }

            for (i = 0; i < _.nodes.length; i++) {
                _.nodes[i].update(_.context);
            }

            if (_.alternate) {
                _.alternate._elementRemove();
            }
        } else {
            for (i = 0; i < _.nodes.length; i++) {
                _.nodes[i]._elementRemove();
            }
            if (!_.alternate) {
                _.alternate = Nodes.FRAG.create(_.bars, _.altFrag);
                _.alternate.parent = _;
            }

            _.alternate.update(_.context);
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
Nodes.PARTIAL = BarsNode.generate(function PartialNode(bars, struct) {
    var _ = this;

    _.supercreate(bars, struct);
});

Nodes.PARTIAL.definePrototype({
    _update: function _update(context) {
        var _ = this;

        if (!_.partial) {
            var partial = _.bars.partials[_.name];

            if (partial && typeof partial === 'object') {
                _.partial = Nodes.FRAG.create(_.bars, partial.struct);
                _.partial.parent = _;
                _.partial.setPath(_.args);
            } else {
                throw new Error('Partial not found: ' + _.name);
            }
        }

        _.partial.update(context);
    }
});


/**
 * [FragNode description]
 * @param {[type]} bars    [description]
 * @param {[type]} struct  [description]
 */
Nodes.FRAG = BarsNode.generate(function FragNode(bars, struct) {
    var _ = this,
        nodes = struct.nodes || ARRAY;

    _.supercreate(bars, struct);

    for (var i = 0; i < nodes.length; i++) {
        var node = nodes[i];

        _.appendChild(Nodes[node.type].create(bars, node));
    }
});

Nodes.FRAG.definePrototype({
    _update: function _update(context) {
        var _ = this;

        if (typeof context !== 'function') {
            _.data = context;
            context = _.getContext('');
        }

        if (_.path) {
            context = context.getContext(_.path);
        }

        for (var i = 0; i < _.nodes.length; i++) {
            _.nodes[i].update(context);
        }
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
            return _.getValue(_.resolve(basepath, path));
        }

        context.getContext = function getContext(path) {
            return _.getContext(_.resolve(basepath, path).join('/'));
        };

        return context;
    },

    setPath: function setPath(path) {
        var _ = this;

        if (path) {
            _.defineProperties({
                path: path.toString()
            });
        }
    },

    resolve: function resolve(basepath, path) {
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

        return newSplitpath;
    }
});

module.exports = Nodes.FRAG;
