var Generator = require('generate-js'),
    GroupNode = require('./group-node'),
    TagNode = require('./tag-node'),
    TextNode = require('./text-node');

var Fragment = Generator.generate(function Fragment(compilr) {
    var _ = this;

    _.defineProperties({
        compilr: compilr
    });
});

Fragment.definePrototype({
    render: function render() {
        var _ = this,
            context = {},
            groupNode = GroupNode.create(_, context);

        var span = TagNode.create('span');
        span._append(TextNode.create('hello, '));

        context.name = TextNode.create(''); // {{name}}
        span._append(context.name);

        span._append(TextNode.create('.'));

        groupNode._append(span);

        return groupNode;
    },
});

module.exports = Fragment;

window.frag = Fragment.create();
