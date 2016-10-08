var Bars = require('./bars-runtime'),
    compile = require('./compiler/compiler3');


Bars.definePrototype({
    compile: function compile(template, filename, mode, flags) {
        var _ = this;
        return _.build(_.parse(template, filename, mode, flags)
            .fragment);
    },

    parse: function parse(template, filename, mode, flags) {
        return compile(template, filename, mode, flags);
    }
});
