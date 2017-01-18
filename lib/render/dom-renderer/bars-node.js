var Generator = require('generate-js');

function insertAfter(newNode, referenceNode) {
    referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
}

var BarsNode = Generator.generate(
    function BarsNode() {}
);

BarsNode.definePrototype({
    update: function update(context) {
        var _ = this;

        var $parent = _.getParent();

        _.prevDOM = $parent && $parent.lastUpdated;

        _._update(context);

        _._elementAppendTo();

        if (_.isDOM && $parent) $parent.lastUpdated = _;
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

    _elementAppendTo: function _elementAppendTo(parent) {
        var _ = this;
        parent = parent || _.getParent();

        parent = parent && parent.$el;

        if (_.prevDOM && _.prevDOM.$el && _.prevDOM.$el.nextSibling !== _.$el) {
            insertAfter(_.$el, _.prevDOM.$el);
        } else if (parent && parent !== _.$el.parentNode) {
            parent.appendChild(_.$el);
        }

    },

    _elementRemove: function _elementRemove() {
        var _ = this;

        if (_.isDOM && _.$el.parentNode instanceof Element) {
            _.$el.parentNode.removeChild(_.$el);
        }
    },

    getParent: function getParent() {
        var _ = this,
            parent = _;

        do {
            parent = parent.parent;
        } while (parent && !parent.isDOM);

        return parent;
    }
});


module.exports = BarsNode;
