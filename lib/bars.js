var Generator = require('generate-js'),
    Fragment = require('./fragment'),
    Parser = require('./parser'),
    Nodes = require('./nodes');

var Bars = Generator.generate(function Bars() {
    var _ = this;

    _.defineProperties({
        blocks: {
            if: Nodes['IF-NODE'],
            unless: Nodes['UNLESS-NODE'],
            each: Nodes['EACH-NODE'],
            with: Nodes['WITH-NODE'],
        },
        partials: {}
    });
});

Bars.definePrototype({
    compile: function compile(template) {
        var _ = this,
            parsed = Parser(template);

        console.log(parsed);

        return Fragment.create(_, parsed );
    },

    registerBlock: function registerBlock(name, block) {
        var _ = this;

        _.blocks[name] = block;
    },

    registerPartial: function registerPartial(name, template) {
        var _ = this;

        _.partials[name] = _.compile(template);
    },
});

module.exports = window.Bars = Bars;
