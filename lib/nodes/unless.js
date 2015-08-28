var BlockNode  = require('./block');

var UnlessNode = BlockNode.generate(function UnlessNode(options) {
    var _ = this;

    _.supercreate(options);
});

UnlessNode.definePrototype({
    name: 'unless',

    condition: function condition(context) {
        var _ = this;
        return !eval(_.blockString);
    },
});

module.exports = UnlessNode;
