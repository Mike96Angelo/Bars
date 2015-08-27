var Node  = require('./node'),
    Group = require('./group');

var IfNode = Node.generate(function IfNode(fragment, context, options) {
    var _ = this;

    _.supercreate(fragment, context, options);

    _.defineProperties({
        consequent: Group.create(),
        alternate: Group.create()
    });

    _.consequent.parent = _;
    _.alternate.parent = _;

    _.con = true;
});

IfNode.definePrototype({
    type: 'IF-NODE',

    update: function(context) {
        var _ = this;

        _.condition(context);
    },

    condition: function condition(context) {
        var _ = this;

        _.con = eval(_.blockString);

        if (_.con) {
            _.consequent.update(context);
        } else {
            _.alternate.update(context);
        }

        _._elementAppendTo(_.$parent);
    },
    _elementAppendTo: function _elementAppendTo(parent) {
        var _ = this;

        if (_.con) {
            _.alternate._elementRemove();
            _.consequent._elementAppendTo(parent);

            _.$parent = parent;

        } else {
            _.consequent._elementRemove();
            _.alternate._elementAppendTo(parent);

            _.$parent = parent;

        }
    },
    _elementRemove: function _elementRemove() {
        var _ = this;

        _.consequent._elementRemove();
        _.alternate._elementRemove();

        _.$parent = null;

    },

});

module.exports = IfNode;
