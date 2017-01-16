var Generator = require('generate-js'),
    Renderer = require('./renderer'),
    Token = require('./compiler/tokens'),
    Blocks = require('./blocks'),
    Transform = require('./transforms'),
    packageJSON = require('../package');

var Bars = Generator.generate(function Bars() {
    var _ = this;

    _.defineProperties({
        blocks: new Blocks(),
        partials: {},
        transforms: new Transform()
    });
});

Bars.definePrototype({
    version: packageJSON.version,
    build: function build(parsedTemplate, state) {
        var _ = this,
            program = parsedTemplate;

        if (Array.isArray(parsedTemplate)) {
            program = new Token.tokens.program();

            program.fromArray(parsedTemplate);
        }

        return new Renderer(_, program, state);
    },

    registerBlock: function registerBlock(name, block) {
        var _ = this;

        _.blocks[name] = block;
    },

    registerPartial: function registerPartial(name, compiledTemplate) {
        var _ = this;

        if (typeof compiledTemplate === 'string') {
            if (!_.preCompile) {
                throw 'partials must be pre-compiled using bars.preCompile(template)';
            }
            compiledTemplate = _.preCompile(compiledTemplate, name, null, {
                minify: true
            });
        }

        var program = compiledTemplate;

        if (Array.isArray(compiledTemplate)) {
            program = new Token.tokens.program();

            program.fromArray(compiledTemplate);
        }

        _.partials[name] = program;
    },

    registerTransform: function registerTransform(name, func) {
        var _ = this;

        _.transforms[name] = func;
    },
});

module.exports = Bars;
