var Generator = require('generate-js'),
    Nodes = window.Nodes = require('./nodes'),
    Context = require('./context');

var Fragment = Generator.generate(function Fragment(bars, struct) {
    var _ = this;

    _.defineProperties({
        bars: bars,
        struct: struct
    });
});

Fragment.definePrototype({
    render: function render(data) {
        var _ = this,
            context = Context.create(data),
            dom = _.build(context);

        if (data) dom.update(data);

        return dom;
    },

    build: function build(context, struct) {
        var _ = this,
            i,
            node;

        struct = struct || _.struct;

        if (struct.type === 'BLOCK-NODE') {
            node = _.bars.blocks[struct.name].create(_, context, {
                blockString: struct.blockString
            });
        } else {
            node = Nodes[struct.type].create(_, context, {
                contextMap: struct.contextMap,
                staticMap: struct.staticMap,
                name: struct.name
            });
        }


        if (node.type === 'IF-NODE') {
            if (struct.consequent && struct.consequent.nodes) {
                for (i = 0; i < struct.consequent.nodes.length; i++) {
                    node.consequent.appendChild( _.build(context, struct.consequent.nodes[i]) );
                }
            }

            if (struct.alternate && struct.alternate.nodes) {
                for (i = 0; i < struct.alternate.nodes.length; i++) {
                    node.alternate.appendChild( _.build(context, struct.alternate.nodes[i]) );
                }
            }
        } else if (struct.nodes) {
            for (i = 0; i < struct.nodes.length; i++) {
                node.appendChild( _.build(context, struct.nodes[i]) );
            }
        }

        return node;
    },
});

module.exports = Fragment;
