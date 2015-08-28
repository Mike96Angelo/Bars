var Generator = require('generate-js'),
    Nodes = window.Nodes = require('./nodes');

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
            dom = _.build();

        if (data) dom.update(data);

        return dom;
    },

    build: function build(struct) {
        var _ = this,
            i,
            node;

        struct = struct || _.struct;

        if (struct.type === 'BLOCK-NODE') {
            node = _.bars.blocks[struct.name].create({
                blockString: struct.blockString,
                nodesFrag: Fragment.create(_.bars, struct.nodesFrag),
                alternateFrag: Fragment.create(_.bars, struct.alternateFrag),
            });
        } else {
            node = Nodes[struct.type].create({
                contextMap: struct.contextMap,
                staticMap: struct.staticMap,
                name: struct.name
            });

            if (struct.nodes) {
                for (i = 0; i < struct.nodes.length; i++) {
                    node.appendChild( _.build(struct.nodes[i]) );
                }
            }
        }

        return node;
    }
});

module.exports = Fragment;
