var Generator = require('generate-js');

var Node = Generator.generate(function Node(fragment, context, options) {
    var _ = this;

    _.defineProperties({
        fragment: fragment,
        context: context,
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

        console.log(_.type, parent);

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
            consequent: _.consequent,
            alternate: _.alternate,
            nodes: _.nodes.length ? _.nodes : void(0)
        };
    },
});

module.exports = Node;
