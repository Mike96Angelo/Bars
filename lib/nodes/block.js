var Node  = require('./node');

var BlockNode = Node.generate(function BlockNode(options) {
    var _ = this;

    _.supercreate(options);

    _.defineProperties({
        alternate: _.alternateFrag.render()
    });

    _.con = true;

    _.appendChild(_.nodesFrag.render());
});

BlockNode.definePrototype({
    type: 'BLOCK-NODE',

    update: function(context) {
        var _ = this,
            i;

        _.con = _.condition(context);

        if (_.con) {
            for (i = 0; i < _.nodes.length; i++) {
                _.nodes[i].update(context);
            }
        } else {
            _.alternate.update(context);
        }

        _._elementAppendTo(_.$parent);
    },

    condition: function condition(context) {
        var _ = this;
        return eval(_.blockString);
    },
    _elementAppendTo: function _elementAppendTo(parent) {
        var _ = this,
            i;

        if (_.con) {
            for (i = 0; i < _.nodes.length; i++) {
                _.nodes[i]._elementAppendTo(parent);
            }

            _.alternate._elementRemove();

            _.$parent = parent;

        } else {

            for (i = 0; i < _.nodes.length; i++) {
                _.nodes[i]._elementRemove();
            }

            _.alternate._elementAppendTo(parent);

            _.$parent = parent;
        }
    },
    _elementRemove: function _elementRemove() {
        var _ = this,
            i;

        for (i = 0; i < _.nodes.length; i++) {
            _.nodes[i]._elementRemove();
        }

        _.alternate._elementRemove();

        _.$parent = null;

    }

});

module.exports = BlockNode;
