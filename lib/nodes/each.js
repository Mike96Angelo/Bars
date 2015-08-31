var BlockNode  = require('./block');

var EachNode = BlockNode.generate(function EachNode(options) {
    var _ = this;

    _.supercreate(options);
});

EachNode.definePrototype({
    name: 'each',

     update: function(context) {
        var _ = this,
            i,
            data = context(_.blockString);

            context = context.getContext(_.blockString);

        if (typeof data === 'object') {
            var keys = Object.keys(data);

            if (keys.length) {
                _.con = true;

                for (i = 0; i < keys.length; i++) {
                    if (_.nodes[i]) {
                        _.nodes[i].update(context.getContext(keys[i]));
                    } else {
                        _.appendChild(_.nodesFrag.render(context.getContext(keys[i])));
                    }
                }

                for (i = data.length; i < _.nodes.length; i++) {
                    _.nodes[i].remove();
                }
            } else {
                _.alternate.update(context);
                _.con = false;
            }
        } else {
            _.alternate.update(context);
            _.con = false;
        }

        _._elementAppendTo(_.$parent);
    },
});

module.exports = EachNode;
