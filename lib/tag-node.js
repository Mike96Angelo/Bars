var Node = require('./node');

var TagNode = Node.generate(function TagNode(tag) {
    var _ = this;

    _.defineProperties({
        $el: document.createElement(tag),
        nodes: [],
        attrs: {
            class: AttrNode()
        }
    });
});

TagNode.definePrototype({
    update: function update(obj) {
        var _ = this;

        for (var key in obj) {
            _.$el.setAttribute(key, obj[key]);
        }
    },

    _append: function _append(node) {
        var _ = this;
        _.$el.appendChild(node.$el);
        _.nodes.push(node);
    },
});

module.exports = TagNode;
