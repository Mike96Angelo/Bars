var Generator = require('generate-js'),
    Nodes = require('./nodes');

var Fragment = Generator.generate(function Fragment(compilr) {
    var _ = this;

    _.defineProperties({
        compilr: compilr
    });
});

/*
 *    <span>hello{{if name}}, {{name}}{{/if}}.<span>
 */

Fragment.definePrototype({
    render: function render() {
        var _ = this,
            context = {},
            groupNode = Nodes.Group.create(_, context);

        var span = Nodes.Tag.create('span');
        span.appendChild(Nodes.Text.create('hello'));

        var ifs = Nodes.If.create();
//IF

        ifs.consequent.appendChild(Nodes.Text.create(', '));

        context.name = Nodes.Text.create(''); // {{name}}
        ifs.consequent.appendChild(context.name);

//ELSE




//FI
        span.appendChild(ifs);
        span.appendChild(Nodes.Text.create('.'));

        groupNode.appendChild(ifs);
        return groupNode;
    },
});

module.exports = Fragment;

window.frag = Fragment.create();
