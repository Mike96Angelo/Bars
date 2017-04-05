var Generator = require('generate-js');
var utils = require('compileit/lib/utils');

var Context = Generator.generate(
    function Context(data, props, asExpression, context, cleanVars) {
        var _ = this;

        _.data = data;
        _.props = props || {};
        _.asExpression = asExpression || [];
        _.context = context;
        _.props._ = _;

        if (cleanVars || !context) {
            _.vars = Object.create(null);
        } else {
            _.vars = Object.create(context.vars);
            _.props.vars = _.vars;
        }
    }
);

Context.definePrototype({
    lookup: function lookup(path) {
        var _ = this,
            i = 0;

        if (path[0] === '@') {
            if (_.props) {
                return _.props[path[1]];
            } else {
                return void(0);
            }
        }

        if (
            path[0] === 'this'
        ) {
            return _.data;
        }

        if (_.vars && path[0] in _.vars) {
            return _.vars[path[0]];
        }

        if (_.data === null || _.data === void(0)) {
            console.warn('Bars Error: Cannot read property ' + path[0] + ' of ' + _.data);
        }

        return _.data ? _.data[path[0]] : void(0);
    },
    newContext: function newContext(data, props, asExpression, cleanVars) {
        return new Context(data, props, asExpression, this, cleanVars);
    },
    contextWithVars: function contextWithVars(vars) {
        var _ = this;

        var context = new Context(_.data, _.props, _.asExpression, _);

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
    },

    applyAsExpression: function applyAsExpression(vars) {
        var _ = this;

        for (var i = 0; i < _.asExpression.length && i < vars.length; i++) {
            _.vars[vars[i]] = _.asExpression[i];
        }
    }
});

module.exports = Context;
