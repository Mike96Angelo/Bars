var Generator = require('generate-js');

var Node = Generator.generate(function Node() {
    var _ = this;

    _.defineProperties({
    });
});

Node.definePrototype({
    remove: function remove() {
        var _ = this;

        _.$el.parentNode.removeChild(_.$el);
    },
});

module.exports = Node;
