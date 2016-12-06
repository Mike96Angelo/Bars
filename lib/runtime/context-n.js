var Generator = require('generate-js');

var Context = Generator.generate(function Context(data, props, context) {
    var _ = this;

    _.data = data;
    _.props = props;
    _.context = context;
});

Context.definePrototype({
    lookup: function lookup(path, prop) {
        var _ = this,
            i = 0;

        if (path[0] === '@') {
            prop = true;
            path = path.slice(1);
        }

        if (path[0] === '~' && _.context) {
            return _.context.lookup(path, prop);
        }

        if (path[0] === '..' && _.context) {
            return _.context.lookup(
                path.slice(1), prop
            );
        }

        if (
            path[0] === 'this' ||
            path[0] === '.' ||
            path[0] === '~'
        ) {
            i = 1;
        }

        var value = (prop ? _.props : _.data);

        for (; value && i < path.length; i++) {

            if (value !== null && value !== void(0)) {
                value = value[path[i]];
            } else {
                value = void(0);
            }
        }

        return value;
    },
    newContext: function newContext(data, props) {
        return new Context(data, props, this);
    }
});

module.exports = Context;
