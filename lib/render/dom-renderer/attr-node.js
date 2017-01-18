var BarsNode = require('./bars-node'),
    NODES = require('./nodes'),
    ac = require('../text-renderer')
    .ac;

/**
 * [AttrNode description]
 * @param {[type]} bars    [description]
 * @param {[type]} struct  [description]
 */
AttrNode = BarsNode.generate(
    function AttrNode(bars, struct) {
        BarsNode.call(this);
        var _ = this;

        _.bars = bars;
        _.name = struct.name;
        _.nodes = struct.nodes;
    }
);

AttrNode.definePrototype({
    isDOM: true,
    update: function update(context) {
        var _ = this;

        _.val = ac(_.nodes, _.bars, context)
            .slice(2, -1);

        _._elementAppendTo();
    },
    _elementAppendTo: function _elementAppendTo(parent) {
        var _ = this;

        parent = parent || _.getParent();

        parent = parent && parent.$el;

        if (parent instanceof Element) {
            parent.setAttribute(_.name, _.val);
        }
    },
    _elementRemove: function _elementRemove() {
        var _ = this,
            parent = _.parent.$el;

        if (parent instanceof Element) {
            parent.removeAttribute(_.name);
        }
    }
});

NODES.attr = AttrNode;
