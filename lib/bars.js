var Generator = require('generate-js'),
    Parser = require('./parser'),
    Renderer = require('./renderer'),
    Blocks = require('./blocks'),
    Helpers = require('./helpers');

var Bars = Generator.generate(function Bars() {
    var _ = this;

    _.defineProperties({
        blocks: Blocks.create(),
        partials: {},
        helpers: Helpers.create()
    });
});

Bars.definePrototype({
    compile: function compile(template) {
        var _ = this,
            parsed = Parser(template);

        // console.log(parsed);

        return Renderer.create(_, parsed );
    },

    registerBlock: function registerBlock(name, block) {
        var _ = this;

        _.blocks[name] = block;
    },

    registerPartial: function registerPartial(name, template) {
        var _ = this;

        _.partials[name] = Parser(template);
    },

    registerHelper: function registerHelper(name, func) {
        var _ = this;

        _.helpers[name] = func;
    },
});

module.exports = window.Bars = Bars;
