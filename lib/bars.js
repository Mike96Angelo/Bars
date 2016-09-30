var Bars = require('./bars-runtime'),
    compile = require('./compiler');


Bars.definePrototype({
    compile: function compile(template, mode) {
        var _ = this;
        return _.build(_.parse(template, mode));
    },

    parse: function parse(template, mode) {
        return compile(template, mode);
    }
});
