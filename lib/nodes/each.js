var BlockNode  = require('./block');

var EachNode = BlockNode.generate(function EachNode(options) {
    var _ = this;

    _.supercreate(options);
});

EachNode.definePrototype({
    name: 'each',

     update: function(context) {
        var _ = this,
            lastCon = _.con,
            node,
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
                        node = _.nodesFrag.render(context.getContext(keys[i]));

                        _.appendChild(node);

                        node._elementAppendTo(_.$parent);

                    }
                }

                for (i = keys.length; i < _.nodes.length; i++) {
                    _.nodes[i].remove();
                }
            } else {
                if (_.alternate) {
                    _.alternate.update(context);
                } else {
                    _.alternate = _.alternateFrag.render(context);
                    _.alternate.parent = _;
                }
                _.con = false;
            }
        } else {
            if (_.alternate) {
                _.alternate.update(context);
            } else {
                _.alternate = _.alternateFrag.render(context);
                _.alternate.parent = _;
            }
            _.con = false;
        }

        if ((!_.con && lastCon) || (_.con && !lastCon)) {
            _._elementAppendTo(_.$parent);
        }
    },
});

module.exports = EachNode;
