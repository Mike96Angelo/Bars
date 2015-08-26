var Generator = require('generate-js'),
    Nodes = window.Nodes = require('./nodes'),
    Context = require('./context');

var Fragment = Generator.generate(function Fragment(struct) {
    var _ = this;

    _.defineProperties({
        struct: struct
    });
});

Fragment.definePrototype({
    render: function render(data) {
        var _ = this,
            context = Context.create(data);

        return _.build(context);
    },

    build: function build(context, struct) {
        var _ = this,
            i;

        struct = struct || _.struct;

        var node = Nodes[struct.type].create(_, context, {
            contextMap: struct.contextMap,
            staticMap: struct.staticMap,
            name: struct.name
        });

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
