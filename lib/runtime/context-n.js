var Generator = require('generate-js');

var Context = Generator.generate(function Context(data, props, context, cleanVars) {
    var _ = this;

    _.data = data;
    _.props = props;
    _.context = context;

    if (cleanVars || !context) {
        _.vars = Object.create(null);
    } else {
        _.vars = Object.create(context.vars);
    }

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

        var value;

        if (!prop &&
            path.length &&
            path[0] !== 'this' &&
            path[0] !== '.' &&
            path[0] !== '~'
        ) {
            value = _.vars;

            for (i = 0; value && i < path.length; i++) {

                if (value !== null && value !== void(0)) {
                    value = value[path[i]];
                } else {
                    value = void(0);
                }
            }

            if (value !== void(0)) {
                return value;
            }
        }

        value = (prop ? _.props : _.data);

        for (i = 0; value && i < path.length; i++) {

            if (value !== null && value !== void(0)) {
                value = value[path[i]];
            } else {
                value = void(0);
            }
        }

        return value;
    },
    newContext: function newContext(data, props, cleanVars) {
        return new Context(data, props, this, cleanVars);
    },
    contextWithVars: function contextWithVars(vars) {
        var _ = this;

        var context = new Context(_.data, _.props, _);

        context.setVars(vars);

        return context;
    },
    setVars: function setVars(vars) {
        var _ = this;

        for (var v in vars) {
            if (vars.hasOwnProperty(v)) {
                _.vars[v] = vars[v];
            }
        }
    }
});

module.exports = Context;
