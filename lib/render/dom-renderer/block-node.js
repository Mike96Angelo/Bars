var BarsNode = require('./bars-node');
var NODES = require('./nodes');
var execute = require('../../runtime/execute');

function makeVars(context, map, bars) {
    var vars = {};
    for (var i = 0; i < map.length; i++) {
        vars[map[i].name] = execute(map[i].expression, bars.transforms, context);
    }
    // console.log(vars);
    return vars;
}

BlockNode = BarsNode.generate(
    function BlockNode(bars, struct) {
        BarsNode.call(this);

        var _ = this;
        var nodes = struct.nodes || [];

        _.bars = bars;

        _.name = struct.name;
        _.arguments = struct.arguments;
        _.map = struct.map;
        _.consequent = struct.consequent;
        _.alternate = struct.alternate;

        _.consMap = new Map();
        _.altsMap = new Map();

        _.nodes = [];

        for (i = 0; i < nodes.length; i++) {
            var node = nodes[i];
            _.appendChild(new NODES[node.type](bars, node));
        }
    }
);

BlockNode.definePrototype({
    _update: function _update(context) {
        var _ = this,
            i;

        var cons = [];

        function consequent(new_context) {
            new_context = new_context || context;
            new_context = new_context.contextWithVars(
                makeVars(new_context, _.map, _.bars)
            );
            cons.push(new_context);
        }

        var alts = [];

        function alternate(new_context) {
            if (new_context) {
                new_context = new_context.contextWithVars(
                    makeVars(new_context, _.map, _.bars)
                );
            }
            alts.push(new_context || context);
        }

        var blockFunc = _.bars.blocks[_.name];

        if (typeof blockFunc !== 'function') {
            throw 'Missing Block helper: ' + _.name;
        }

        blockFunc(
            _.arguments.map(function (expression) {
                return execute(expression, _.bars.transforms, context);
            }),
            consequent,
            alternate,
            context
        );

        var newNodes = [];

        if (cons.length) {
            for (i = 0; i < cons.length; i++) {
                newNodes.push(
                    _.consMap.get(cons[i].data) ||
                    new NODES[_.consequent.type](_.bars, _.consequent)
                );
            }
            _.consMap.clear();

            for (i = 0; i < cons.length; i++) {
                _.consMap.set(cons[i].data, newNodes[i]);
            }

            for (i = 0; i < _.nodes.length; i++) {
                if (newNodes.indexOf(_.nodes[i]) === -1) {
                    _.nodes[i].remove();
                }
            }

            _.nodes = [];

            for (i = 0; i < newNodes.length; i++) {
                _.appendChild(newNodes[i]);
            }

            for (i = 0; i < _.nodes.length; i++) {
                _.nodes[i].update(cons[i]);
            }
        } else {
            for (i = 0; i < alts.length; i++) {
                newNodes.push(
                    _.altsMap.get(alts[i]) ||
                    new NODES[_.alternate.type](_.bars, _.alternate)
                );
            }
            _.altsMap.clear();

            for (i = 0; i < alts.length; i++) {
                _.altsMap.set(alts[i], newNodes[i]);
            }

            for (i = 0; i < _.nodes.length; i++) {
                if (newNodes.indexOf(_.nodes[i]) === -1) {
                    _.nodes[i].remove();
                }
            }

            _.nodes = [];

            for (i = 0; i < newNodes.length; i++) {
                _.appendChild(newNodes[i]);
            }

            for (i = 0; i < _.nodes.length; i++) {
                _.nodes[i].update(cons[i]);
            }
        }
    },
    _elementAppendTo: function _elementAppendTo(parent) {
        var _ = this;
        parent = parent || _.getParent();

        for (var i = 0; i < _.nodes.length; i++) {
            _.nodes[i]._elementAppendTo(parent);
        }
    },

    _elementRemove: function _elementRemove() {
        var _ = this;

        for (var i = 0; i < _.nodes.length; i++) {
            _.nodes[i]._elementRemove();
        }
    }
});

NODES.block = BlockNode;
