var BarsNode = require('./bars-node');
var NODES = require('./nodes');
var execute = require('../../runtime/execute');

Fragment = BarsNode.generate(
    function Fragment(bars, struct) {
        BarsNode.call(this);

        var _ = this;
        var nodes = struct.nodes || [];

        // _.$el = document.createDocumentFragment();
        _.nodes = [];

        for (i = 0; i < nodes.length; i++) {
            var node = nodes[i];
            _.appendChild(new NODES[node.type](bars, node));
        }
    }
);

Fragment.definePrototype({
    _update: function _update(context) {
        var _ = this,
            i;

        for (i = 0; i < _.nodes.length; i++) {
            _.nodes[i].update(context);
        }
    },

    _elementAppendTo: function _elementAppendTo(parent) {
        var _ = this;
        parent = parent || _.getParent();

        for (var i = 0; i < _.nodes.length; i++) {
            _.nodes[i]._elementAppendTo(parent);
        }
    },

    _elementRemove: function _elementRemove() {
        var _ = this;

        for (var i = 0; i < _.nodes.length; i++) {
            _.nodes[i]._elementRemove();
        }
    }
});

NODES.fragment = Fragment;
