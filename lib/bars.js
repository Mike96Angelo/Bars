var Bars = require('./bars-runtime'),
    compile = require('./compiler');


Bars.definePrototype({
    compile: function compile(template, filename, mode, flags) {
        var _ = this;
        return _.build(_.parse(template, filename, mode, flags));
    },

    parse: function parse(template, filename, mode, flags) {
        return compile(template, filename, mode, flags);
    }
});

module.exports = Bars;
