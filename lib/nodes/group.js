var Node = require('./node');

/**
 * <span>hello, {{name}}.</span>
 */

var GroupNode = Node.generate(function GroupNode(fragment, context, options) {
    var _ = this;

    _.supercreate(fragment, context, options);
});

GroupNode.definePrototype({
    type: 'GROUP-NODE',

    update: function update(data) {
        var _ = this,
            context;

        if (typeof data === 'function') {
            context = data;
        } else {
            _.context.data = data;
            context = _.context.getContext('');
        }

        for (var i = 0; i < _.nodes.length; i++) {
            _.nodes[i].update(context);
        }
    },
    _elementAppendTo: function _elementAppendTo(parent) {
        var _ = this;
        console.log(_.type, _, parent);

        for (var i = 0; i < _.nodes.length; i++) {
            _.nodes[i]._elementAppendTo(parent);
            _.$parent = parent;
        }
    },
    _elementRemove: function _elementRemove() {
        var _ = this;

        for (var i = 0; i < _.nodes.length; i++) {
            _.nodes[i]._elementRemove();
        }
        _.$parent = null;
    },
});

module.exports = GroupNode;
