var Generator = require('generate-js');

var Context_ = Generator.generate(function Context(data, parentContext, barsProps) {
    var _ = this;

    _.defineProperties({
        data: data,
        barsProps: barsProps || {},
        parentContext: Context_.isCreation(parentContext) ? parentContext : null
    });
});

Context_.definePrototype({
    lookup: function lookup(path) {
        var _ = this,
            splitPath;

        if (path instanceof Array) {
            splitPath = path;
        } else if (typeof path === 'string') {
            if (path.match(/[/]/)) {
                splitPath = path.split('/');
            } else {
                splitPath = path.split('.');
            }

            if (!splitPath[0] && !splitPath[1]) {
                splitPath = ['.'];
            }

            var barsProp = splitPath.pop().split('@');
            if (barsProp[0]) {
                splitPath.push(barsProp[0]);
            }
            if (barsProp[1]) {
                splitPath.push('@' + barsProp[1]);
            }
        } else {
            throw 'bad arrgument: expected String | Array<String>.';
        }

        if (splitPath[0] === '~' && _.parentContext) {
            return _.parentContext.lookup(splitPath);
        }

        if (splitPath[0] === '..' && _.parentContext) {
            splitPath.shift();
            return _.parentContext.lookup(splitPath);
        }

        if (
            splitPath[0] === 'this' ||
            splitPath[0] === '.' ||
            splitPath[0] === '~' ||
            splitPath[0] === '..'
        ) {
            splitPath.shift();
        }

        var value = _.data;

        for (var i = 0; value && i < splitPath.length; i++) {

            if (splitPath[i][0] === '@') {
                value =  _.barsProps[splitPath[i].slice(1)];
            } else if (value !== null && value !== void(0)) {
                value = value[splitPath[i]];
            } else {
                value = undefined;
            }
        }

        return value;
    },

    newContext: function newContext(obj, barsProps) {
        var _ = this;

        return Context_.create(obj, _, barsProps);
    }
});

module.exports = Context_;
