var BlockNode  = require('./block');

var WithNode = BlockNode.generate(function WithNode(options) {
    var _ = this;

    _.supercreate(options);
});

WithNode.definePrototype({
    name: 'with',

    update: function(context) {
        var _ = this,
            node,
            lastCon = _.con,
            data = context(_.blockString);

        if (typeof data === 'object') {
            _.con = true;
            context = context.getContext(_.blockString);
        } else {
            _.con = false;
        }

        if (_.con) {
            if (_.nodes[0]) {
                _.nodes[0].update(context);
            } else {
                node = _.nodesFrag.render(context);

                _.appendChild(node);

                node._elementAppendTo(_.$parent);
            }
        } else {
            if (_.alternate) {
                _.alternate.update(context);
            } else {
                _.alternate = _.altFrag.render(context);
                _.alternate.parent = _;
                _.alternate.parentTag = _.alternate.getParentTag();
            }
        }

        if ((!_.con && lastCon) || (_.con && !lastCon)) {
            _._elementAppendTo(_.$parent);
        }

        _._elementAppendTo(_.$parent);
    },
});

module.exports = WithNode;
