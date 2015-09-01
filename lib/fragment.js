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
            node,
            helper;

        struct = struct || _.struct;

        if (struct.type === 'BLOCK-NODE') {
            node = _.bars.blocks[struct.name].create({
                blockString: struct.blockString,
                nodesFrag: Fragment.create(_.bars, struct.nodesFrag),
                alternateFrag: Fragment.create(_.bars, struct.alternateFrag),
                bars: _.bars
            });
        } else if (struct.type === 'PARTIAL-NODE') {
            node = _.bars.partials[struct.name];

            if (!node) {
                throw new Error('Partial not found: ' + struct.name);
            }

            node = node.render();
        } else {
            node = Nodes[struct.type].create({
                contextPath: struct.contextPath,
                content: struct.content,
                name: struct.name,
                bars: _.bars,
                blockString: struct.blockString
            });

            if (struct.nodes) {
                for (i = 0; i < struct.nodes.length; i++) {
                    node.appendChild( _.build(struct.nodes[i]) );
                }
            }
        }

        if (struct.type === 'TAG-NODE' && struct.attrs) {
            for (i = 0; i < struct.attrs.length; i++) {
                node.addAttr( _.build(struct.attrs[i]) );
            }
        }

        return node;
    }
});

module.exports = Fragment;
