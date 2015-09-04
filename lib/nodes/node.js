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

        while (parent && parent.isDOM) {
            oldParent = parent;
            parent = parent.parent;
        }

        _.parentTag = oldParent;
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
