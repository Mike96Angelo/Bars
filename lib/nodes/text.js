var Node = require('./node');

var TextNode = Node.generate(function TextNode(options) {
    var _ = this;

    _.supercreate(options);

    _.defineProperties({
        $el: document.createTextNode(options.staticMap && options.staticMap.textContent)
    });
});

TextNode.definePrototype({
    type: 'TEXT-NODE',
});

module.exports = TextNode;
