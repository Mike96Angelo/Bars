var Generator = require('generate-js'),
    // Parser = require('./parser'),
    Parser = require('./compiler/compiler'),
    Renderer = require('./renderer'),
    Blocks = require('./blocks'),
    Transform = require('./transforms');

var Bars = Generator.generate(function Bars() {
    var _ = this;

    _.defineProperties({
        blocks: Blocks.create(),
        partials: {},
        transforms: Transform.create()
    });
});

Bars.definePrototype({
    compile: function compile(template) {
        var _ = this;
        return _.build( _.parse(template) );
    },

    parse: function parse(template) {
        return Parser(template);
    },

    build: function build(parsedTemplate) {
        var _ = this;
        return Renderer.create( _, parsedTemplate );
    },

    registerBlock: function registerBlock(name, block) {
        var _ = this;

        _.blocks[name] = block;
    },

    registerPartial: function registerPartial(name, template) {
        var _ = this;

        _.partials[name] = _.compile(template);
    },

    registerTransform: function registerTransform(name, func) {
        var _ = this;

        _.transforms[name] = func;
    },
});

module.exports = window.Bars = Bars;
