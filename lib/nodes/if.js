var Node  = require('./node'),
    Group = require('./group');

var IfNode = Node.generate(function IfNode(condition, context) {
    var _ = this;
    _.defineProperties({
        // condition: condition,
        consequent: Group.create(),
        alternate: Group.create(),
        nodes: [],
        context: context
    });
});

IfNode.definePrototype({
    update: function(data) {
        var _ = this;

        _.condition(data);
    },

    condition: function condition(data) {
        var _ = this,
            con = !!window.IF;

        if (con) {
            _.alternate.remove();
            _.consequent.update(data);
            _.appendChild(_.consequent);
        } else {
            _.consequent.remove();
            _.alternate.update(data);
            _.appendChild(_.alternate);
        }
    },
});

module.exports = IfNode;
