var Generator = require('generate-js');

var Node = Generator.generate(function Node() {
    var _ = this;

    _.defineProperties({
        nodes: []
    });
});

Node.definePrototype({
    appendChild: function appendChild(child) {
        var _ = this;

        _.nodes.push(child);
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

        if (parent instanceof Element) {
            parent.appendChild(_.$el);
        }
    },
    _elementRemove: function _elementRemove() {
        var _ = this;

        _.$el.parentNode.removeChild(_.$el);
    },
});

module.exports = Node;
