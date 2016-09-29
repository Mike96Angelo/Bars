var Generator = require('generate-js'),
    Frag = require('./frag');

var Renderer = Generator.generate(function Renderer(bars, struct) {
    var _ = this;

    _.defineProperties({
        bars: bars,
        struct: struct
    });
});

Renderer.definePrototype({
    render: function render() {
        var _ = this;
        return new Frag(_.bars, _.struct);
    },
});

module.exports = Renderer;
