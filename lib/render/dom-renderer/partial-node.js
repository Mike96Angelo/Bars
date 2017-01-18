var BarsNode = require('./bars-node');
var NODES = require('./nodes');
var execute = require('../../runtime/execute');

function makeVars(context, map, bars) {
    var vars = {};
    for (var i = 0; i < map.length; i++) {
        vars[map[i].name] = execute(map[i].expression, bars.transforms, context);
    }

    return vars;
}

PartialNode = BarsNode.generate(
    function PartialNode(bars, struct) {
        BarsNode.call(this);

        var _ = this;
        var nodes = struct.nodes || [];

        _.bars = bars;

        _.name = struct.name;
        _.expression = struct.expression;
        _.map = struct.map;

        _.nodes = [];

        _.fragMap = new Map();
    }
);

PartialNode.definePrototype({
    _update: function _update(context) {
        var _ = this,
            i, name = _.name;

        if (typeof _.name === 'object') {
            name = execute(_.name, _.bars.transforms, context);
        }

        var frag = _.fragMap.get(name);

        if (!frag) {
            var partial = _.bars.partials[name];

            if (!partial) {
                throw 'error';
            }

            frag = new NODES.fragment(_.bars, partial.fragment);

            _.fragMap.set(name, frag);
        }

        if (_.expression) {
            context = context.newContext(
                execute(_.expression, _.bars.transforms, context),
                null,
                true
            );
        }

        context = context.contextWithVars(makeVars(context, _.map, _.bars));

        if (_.nodes[0] !== frag) {
            if (_.nodes[0]) {
                _.nodes[0].remove();
            }

            _.nodes = [];

            _.appendChild(frag);
        }

        frag.update(context);
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

NODES.partial = PartialNode;
