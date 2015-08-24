var Node = require('./node');

var AttrNode = Node.generate(function AttrNode() {
    var _ = this,
        text = '';
    _.defineProperties({
        text: {
            get: function get() {
                return text;
            },
            set: function set(value) {
                text = '' + value;
            },
        }
    });
});

AttrNode.definePrototype({
    update: function(data) {
        var _ = this;
        _.text = data;
    }
});

module.exports = AttrNode;
