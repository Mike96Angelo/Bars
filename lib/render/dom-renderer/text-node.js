var BarsNode = require('./bars-node');
var NODES = require('./nodes');
var execute = require('../../runtime/execute');

/**
 * [TextNode description]
 * @param {[type]} bars    [description]
 * @param {[type]} struct  [description]
 */
TextNode = BarsNode.generate(
    function TextNode(bars, struct) {
        BarsNode.call(this);
        var _ = this;

        _.$el = document.createTextNode(struct.value);

        _.bars = bars;

        _.expression = struct.expression;
    }
);

TextNode.definePrototype({
    isDOM: true,
    appendChild: function appendChild(child) {
        console.warn('appendChild CANNOT be called on TextNodes.');
    },

    _update: function _update(context) {
        var _ = this;

        if (_.expression) {
            _.$el.textContent = execute(_.expression, _.bars.transforms, context);
        }
    },
});

NODES.text = TextNode;
NODES.insert = TextNode;
