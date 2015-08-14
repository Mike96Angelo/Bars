var Node = require('./node');

var TextNode = Node.generate(function TextNode(text) {
    var _ = this;

    _.defineProperties({
        $el: document.createTextNode(text)
    });
});

TextNode.definePrototype({
    update: function(data) {
        var _ = this;

        _.$el.textContent = data;
    }
});

module.exports = TextNode;
