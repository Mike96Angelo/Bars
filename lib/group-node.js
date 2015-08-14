var Node = require('./node');

/**
 * <span>hello, {{name}}.</span>
 */

var GroupNode = Node.generate(function GroupNode(fragment, context) {
    var _ = this;

    _.defineProperties({
        fragment: fragment,
        context: context,
        nodes: []
    });
});

GroupNode.definePrototype({
    update: function update(obj) {
        var _ = this;

        for (var key in obj) {
            _.context[key].update(obj[key]);
        }
    },

    _append: function _append(node) {
        var _ = this;

        _.nodes.push(node);
    },
});

module.exports = GroupNode;
