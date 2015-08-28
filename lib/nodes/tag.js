var Node = require('./node');

var TagNode = Node.generate(function TagNode(options) {
    var _ = this;

    _.supercreate(options);

    _.defineProperties({
        $el: document.createElement(options.name),
        attrs: {
            // class: AttrNode()
        }
    });
});

TagNode.definePrototype({
    type: 'TAG-NODE',
    update: function update(data) {
        var _ = this;
        //self

        //then children
        for (var i = 0; i < _.nodes.length; i++) {
            _.nodes[i].update(data);
        }
    },
});

module.exports = TagNode;
