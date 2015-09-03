var Node  = require('./node');

var BlockNode = Node.generate(function BlockNode(options) {
    var _ = this;

    _.supercreate(options);

    _.con = false;
});

BlockNode.definePrototype({
    type: 'BLOCK-NODE',

    update: function(context) {
        var _ = this,
            node,
            lastCon = _.con;

        _.con = _.condition(context);

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
                _.alternate = _.alternateFrag.render(context);
                _.alternate.parent = _;
                _.alternate.parentTag = _.alternate.getParentTag();
            }
        }

        if ((!_.con && lastCon) || (_.con && !lastCon)) {
            _._elementAppendTo(_.$parent);
        }
    },

    condition: function condition(context) {
        var _ = this;
        return context(_.blockString);
    },
    _elementAppendTo: function _elementAppendTo(parent) {
        var _ = this,
            i;

        if (_.con) {
            for (i = 0; i < _.nodes.length; i++) {
                _.nodes[i]._elementAppendTo(parent);
            }

            if (_.alternate) {
                _.alternate._elementRemove();
            }

            _.$parent = parent;

        } else {

            for (i = 0; i < _.nodes.length; i++) {
                _.nodes[i]._elementRemove();
            }

            if (_.alternate) {
                _.alternate._elementAppendTo(parent);
            }

            _.$parent = parent;
        }
    },
    _elementRemove: function _elementRemove() {
        var _ = this,
            i;

        for (i = 0; i < _.nodes.length; i++) {
            _.nodes[i]._elementRemove();
        }

        if (_.alternate) {
            _.alternate._elementRemove();
        }

        _.$parent = null;

    }

});

module.exports = BlockNode;
