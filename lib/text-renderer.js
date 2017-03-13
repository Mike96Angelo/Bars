var Generator = require('generate-js');
var ContextN = require('./runtime/context-n');
var renderT = require('./render/text-renderer');

function repeat(a, n) {
    n = n || 0;
    var r = '';
    for (var i = 0; i < n; i++) {
        r += a;
    }
    return r;
}

var TextRenderer = Generator.generate(function TextRenderer(bars, struct, state) {
    var _ = this;

    _.bars = bars;
    _.struct = struct;
});

TextRenderer.definePrototype({
    render: function render(state, options) {
        var _ = this;

        options = options || {};

        var indent = repeat(options.tabs ? '\t' : ' ', options.tabs ? 1 : options.indent);

        return renderT(_.struct.fragment, indent, _.bars, new ContextN(state));
    }
});

module.exports = TextRenderer;
