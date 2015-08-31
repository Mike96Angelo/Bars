var Node = require('./node');

var TagNode = Node.generate(function TagNode(options) {
    var _ = this;

    _.supercreate(options);

    _.defineProperties({
        $el: document.createElement(options.name),
        attrs: []
    });
});

TagNode.definePrototype({
    type: 'TAG-NODE',
    update: function update(context) {
        var _ = this, i;

        //self
        for (i = 0; i < _.attrs.length; i++) {
            _.attrs[i].update(context);
        }

        //then children
        for (i = 0; i < _.nodes.length; i++) {
            _.nodes[i].update(context);
        }
    },
    addAttr: function addAttr(child) {
        var _ = this;

        _.attrs.push(child);
        child._elementAppendTo(_.$el);

        child.parent = _;
        child.parentTag = _.getParentTag();

    },
});

module.exports = TagNode;
