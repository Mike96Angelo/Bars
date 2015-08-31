var BlockNode  = require('./block');

var WithNode = BlockNode.generate(function WithNode(options) {
    var _ = this;

    _.supercreate(options);
});

WithNode.definePrototype({
    name: 'with',

    condition: function condition(context) {
        var _ = this;

        return context(_.blockString).length;
    },

     update: function(context) {
        var _ = this,
            data = context(_.blockString);

        if (typeof data === 'object') {
            _.con = true;

            context = context.getContext(_.blockString);

            _.nodes[0].update(context);
        } else {
            _.con = false;
            _.alternate.update(context);
        }

        _._elementAppendTo(_.$parent);
    },
});

module.exports = WithNode;
