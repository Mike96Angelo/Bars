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

    build: function build(struct, parent) {
        var _ = this,
            i,
            node;

        struct = struct || _.struct;

        if (struct.type === 'BLOCK-NODE') {
            node = _.bars.blocks[struct.name].create({
                blockString: struct.blockString,
                nodesFrag: Fragment.create(_.bars, struct.nodesFrag),
                altFrag: Fragment.create(_.bars, struct.altFrag),
                bars: _.bars
            });

            if (parent) {
                parent.appendChild(node);
            }
        } else if (struct.type === 'PARTIAL-NODE') {
            node = _.bars.partials[struct.name];

            if (!node) {
                throw new Error('Partial not found: ' + struct.name);
            }

            node = node.render();
            node.setPath(struct.blockString);

            if (parent) {
                parent.appendChild(node);
            }
        } else {
            node = Nodes[struct.type].create({
                contextPath: struct.contextPath,
                content: struct.content,
                name: struct.name,
                bars: _.bars,
                blockString: struct.blockString
            });

            if (parent) {
                parent.appendChild(node);
            }

            if (struct.nodes) {
                for (i = 0; i < struct.nodes.length; i++) {
                    _.build(struct.nodes[i], node);
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
