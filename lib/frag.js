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
        hasUpdate: {
            get: _.getHasNoUpdate,
            set: _.setHasNoUpdate
        },
        type: struct.type,
        name: struct.name,
        text: struct.text,
        args: struct.args,
        conFrag: struct.conFrag,
        altFrag: struct.altFrag,
    });

    _._hasUpdate = true;
    _.appended = false;
});

BarsNode.definePrototype({
    update: function update(context) {
        var _ = this;

        if (_.isDOM) {
            _.parentTag.previousDom = _;
        }

        if (!_.hasUpdate) return;

        _.hasUpdate = false;

        _.previousDom = null;

        _._update(context);

        // console.log('UPDATE', _.type, _.appended);

        if (!_.appended) {
            _._elementAppendTo();
        }


        // console.log('UPDATE', _.type, _.appended);

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

    empty: function empty() {
        var _ = this,
            i;

        for (i = _.nodes.length - 1; i >= 0; i--) {
            _.nodes[i].remove();
        }
    },

    remove: function remove() {
        var _ = this;

        if (_.parent) {
            _.parent.removeChild(_);
        }

        _._elementRemove();
    },

    removeChild: function removeChild(child) {
        var _ = this,
            index = _.nodes.indexOf(child);

        if (index >= 0) {
            _.nodes.splice(index, 1);
            child._elementRemove();
        }
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

    getHasNoUpdate: function getHasNoUpdate() {
        var _ = this;
        return _._hasUpdate;
    },

    setHasNoUpdate: function setHasNoUpdate(value) {
        var _ = this;
        if (value) {
            _._hasUpdate = true;
            if (_.parent) {
                _.parent.setHasNoUpdate(true);
            }
        } else {
            _._hasUpdate = false;
        }
    },

    _elementAppendTo: function _elementAppendTo(parent) {
        var _ = this,
            prev;

        if (_.isDOM) {
            if (!_.parentTag) return;

            parent = _.parentTag.$el || _.parentTag.$parent;

            if (!parent) return;

            prev = _.prevDom;

            if (prev) {
                parent.insertBefore(_.$el, prev.$el.nextSibling);
            } else {
                parent.appendChild(_.$el);
            }

            _.appended = true;
        }
    },

    _elementRemove: function _elementRemove() {
        var _ = this;

        if (_.isDOM && _.$el.parentNode instanceof Element) {
            _.$el.parentNode.removeChild(_.$el);
        }
        _.appended = false;
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
            if (!_.hasUpdate) {
                _.hasUpdate = true;
            }
        } else if (typeof _.args === 'string') {
            _.$el.textContent = context(_.args);
            if (!_.hasUpdate) {
                _.hasUpdate = true;
            }
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
        node,
        attrs = struct.attrs || ARRAY,
        attr,
        i;

    _.supercreate(bars, struct);

    _.defineProperties({
        $el: document.createElement(struct.name),
        attrs: []
    });

    for (i = 0; i < nodes.length; i++) {
        node = nodes[i];
        _.appendChild(Nodes[node.type].create(bars, node));
    }

    for (i = 0; i < attrs.length; i++) {
        attr = attrs[i];
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
    toString: function toString() {
        var _ = this,
        html = '';

        html += _.$el.outerHTML;

        return html;
    },
});


/**
 * [AttrNode description]
 * @param {[type]} bars    [description]
 * @param {[type]} struct  [description]
 */
Nodes.ATTR = BarsNode.generate(function AttrNode(bars, struct) {
    var _ = this,
        nodes = struct.nodes || ARRAY,
        node,
        i;

    _.supercreate(bars, struct);

    _.defineProperties({
        $el: document.createElement('div'),
    });

    for (i = 0; i < nodes.length; i++) {
        node = nodes[i];
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
            parent.setAttribute(_.name, _.$el.innerText);
            // _.appended = true;
        }
    },
    _elementRemove: function _elementRemove() {
        var _ = this,
            parent = _.parentTag.$el;

        if (parent instanceof Element) {
            parent.removeAttribute(_.name);
        }
        // _.appended = false;
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

    _.defineProperties({
        nodesCache: []
    });
});

Nodes.BLOCK.definePrototype({
    type: 'BLOCK',

    createFragment: function createFragment(path) {
        var _ = this,
            frag = _.nodesCache.pop();

        if (!frag) { console.log('2437335375747474747474477747477475475')
            frag = Nodes.FRAG.create(_.bars, _.conFrag);
        }

        frag.path = path;

        _.appendChild(frag);
    },

    removeChild: function removeChild(child) {
        var _ = this,
            index = _.nodes.indexOf(child);

        clearTimeout(_.emptyNodesCache);

        if (index >= 0) {
            _.nodes.splice(index, 1);
            _.nodesCache.push(child);
            child._elementRemove();
        }

        _.emptyNodesCache = setTimeout(function () {
            while(_.nodesCache.length > 2) _.nodesCache.pop();
        }, 2000);
    },

    _update: function _update(context) {
        var _ = this,
            i;

        if (typeof _.bars.blocks[_.name] === 'function') {
            _.context = context;
            _.con = _.bars.blocks[_.name].call(_, _.context(_.args));
        } else {
            throw new Error('Block helper not found: ' + _.name);
        }

        if (_.con) {
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
        if (!_.hasUpdate) {
            _.hasUpdate = true;
        }
    },
    _elementAppendTo: function _elementAppendTo() {
        var _ = this;
        _.appended = true;
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
        _.appended = false;
    },
    toString: function toString() {
        var _ = this,
        html = '';

        if (_.con) {
            for (var i = 0; i < _.nodes.length; i++) {
                html += _.nodes[i];
            }
        } else {
            html += _.alternate;
        }

        return html;
    },
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
        var _ = this,
            partial;

        if (!_.partial) {
            partial = _.bars.partials[_.name];

            if (partial && typeof partial === 'object') {
                _.partial = Nodes.FRAG.create(_.bars, partial);
                _.partial.parent = _;
                _.partial.path = _.args;
            } else {
                throw new Error('Partial not found: ' + _.name);
            }
        }

        _.partial.update(context);

        if (!_.hasUpdate) {
            _.hasUpdate = true;
        }
    },
    toString: function toString() {
        var _ = this,
        html = '';

        if (_.partial) {
            html += _.partial;
        }

        return html;
    },
});


/**
 * [FragNode description]
 * @param {[type]} bars    [description]
 * @param {[type]} struct  [description]
 */
Nodes.FRAG = BarsNode.generate(function FragNode(bars, struct) {
    var _ = this,
        nodes = struct.nodes || ARRAY,
        node,
        i;

    _.supercreate(bars, struct);

    for (i = 0; i < nodes.length; i++) {
        node = nodes[i];

        _.appendChild(Nodes[node.type].create(bars, node));
    }
});

Nodes.FRAG.definePrototype({
    _update: function _update(context) {
        var _ = this,
            helper,
            args,
            content,
            i;

        if (typeof context !== 'function') {
            _.data = context;
            context = _.getContext('');
        }

        if (_.path) {
            context = context.getContext(_.path);
        }

         if (_.name) {
            _.empty();
            helper = _.bars.helpers[_.name];

            if (typeof helper === 'function') {
                args = _.args.split(/\s+/).map(function(item) {
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
        } else if (_.args) {
            _.empty();
            content =  context(_.args);

            if (content === null || content === void(0)) {
                content = '';
            } else {
                content = '' + content;
            }

            content = _.bars.compile(content).render(context);

            _.appendChild(content);
        }

        for (i = 0; i < _.nodes.length; i++) {
            _.nodes[i].update(context);
        }

        if (!_.hasUpdate) {
            _.hasUpdate = true;
        }
    },

    _elementAppendTo: function _elementAppendTo(parent) {
        var _ = this;
        if (parent instanceof Element) {
            _.$parent = parent;
            _.appended = true;
        } else if (_.parent) {
            for (var i = 0; i < _.nodes.length; i++) {
                _.nodes[i]._elementAppendTo();
            }

            _.appended = true;
        }
    },
    _elementRemove: function _elementRemove() {
        var _ = this,
            i;

        for (i = 0; i < _.nodes.length; i++) {
            _.nodes[i]._elementRemove();
        }

        _.$parent = null;
        _.appended = false;
    },

    appendTo: function appendTo(parent) {
        var _ = this;

        _._elementAppendTo(parent);
        _.update(_.data);
    },

    getValue: function getValue(splitPath) {
        var _ = this,
            value = _.data,
            i;

        for (i = 0; i < splitPath.length; i++) {
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

    resolve: function resolve(basepath, path) {
        var newSplitpath,
            i;

        if (path[0] === '/') {
            newSplitpath = path.split('/');
        } else {
            newSplitpath = basepath.split('/').concat(path.split('/'));
        }


        for (i = 0; i < newSplitpath.length; i++) {
            if (newSplitpath[i] === '.' || newSplitpath[i] === '') {
                newSplitpath.splice(i, 1);
                i--;
            } else if (newSplitpath[i] === '..') {
                newSplitpath.splice(i - 1, 2);
                i -= 2;
            }
        }

        return newSplitpath;
    },

    toString: function toString() {
        var _ = this,
        html = '';

        for (var i = 0; i < _.nodes.length; i++) {
            html += _.nodes[i];
        }
        return html;
    },
});

module.exports = Nodes.FRAG;
