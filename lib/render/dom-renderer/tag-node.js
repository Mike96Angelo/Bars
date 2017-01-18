var BarsNode = require('./bars-node');
var NODES = require('./nodes');
var execute = require('../../runtime/execute');

TagNode = BarsNode.generate(
    function TagNode(bars, struct) {
        BarsNode.call(this);

        var _ = this,
            nodes = struct.nodes || [],
            attrs = struct.attrs || [],
            i;

        _.bars = bars;

        _.$el = document.createElement(struct.name);
        _.attrs = [];
        _.nodes = [];
        _.props = struct.props || [];

        for (i = 0; i < nodes.length; i++) {
            var node = nodes[i];
            _.appendChild(new NODES[node.type](bars, node));
        }

        for (i = 0; i < attrs.length; i++) {
            var attr = attrs[i];
            _.addAttr(new NODES[attr.type](bars, attr));
        }
    }
);

TagNode.definePrototype({
    isDOM: true,
    _update: function _update(context) {
        var _ = this,
            i,
            _data = {};

        for (i = 0; i < _.props.length; i++) {
            _data[_.props[i].name] = execute(
                _.props[i].expression,
                _.bars.transforms,
                context
            );
        }

        _.$el.data = function data(key) {
            return _data[key];
        };

        for (i = 0; i < _.attrs.length; i++) {
            _.attrs[i].update(context);
        }

        _.lastUpdated = null;

        for (i = 0; i < _.nodes.length; i++) {
            _.nodes[i].update(context);
        }

        _.lastUpdated = null;
    },

    addAttr: function addAttr(child) {
        var _ = this;

        _.attrs.push(child);
        child.parent = _;
    }
});

NODES.tag = TagNode;
