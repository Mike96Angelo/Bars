var Node = require('./node');
var GroupNode = require('./group');

var LoopNode = Node.generate(function LoopNode(fragment, context) {
    var _ = this;

    _.supercreate();

    _.defineProperties({
        alternate: [],
        consequent: [],
    });
});

LoopNode.definePrototype({
    type: 'LOOP-NODE',

    update: function(data) {
        var _ = this,
            i,
            keys;

        if (data instanceof Array) {
            for (i = 0; i < data.length; i++) {
                if (_.consequent[i]) {
                    _.append(_.consequent[i].update(data[i]));
                } else {
                    _.append(_.fragment.render(data[i]));
                }
            }

            for (i = data.length; i < _.consequent.length; i++) {
                _.consequent[i].remove();
            }

            for (i = 0; i < _.alternate.length; i++) {
                _.alternate[i].remove();
            }
        } else if (data && typeof data === 'object') {

            keys = Object.keys(data);

            for (i = 0; i < keys.length; i++) {
                if (_.consequent[i]) {
                    _.append(_.consequent[i].update(data[keys[i]]));
                } else {
                    _.append(_.fragment.render(data[keys[i]]));
                }
            }

            for (i = keys.length; i < _.consequent.length; i++) {
                _.consequent[i].remove();
            }

            for (i = 0; i < _.alternate.length; i++) {
                _.alternate[i].remove();
            }
        } else {
            for (i = 0; i < _.consequent.length; i++) {
                _.consequent[i].remove();
            }
            for (i = 0; i < _.alternate.length; i++) {
                _.append(_.alternate[i]);
            }
        }
    }
});

module.exports = LoopNode;
