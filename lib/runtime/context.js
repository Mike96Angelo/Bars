var Generator = require('generate-js');

function pathResolver(base, path) {
    base = base.slice();
    path = path.slice();

    while (base.length && path[0] === '..') {
        path.shift();
        base.pop();
    }

    return base.concat(path);
}

function pathSpliter(path) {
    var splitPath;

    if (path instanceof Array) {
        splitPath = path;
    } else if (typeof path === 'string') {
        if (path.match(/[/]|[.][.]/)) {
            splitPath = path.split('/');
        } else {
            splitPath = path.split('.');
        }

        if (!splitPath[0] && !splitPath[1]) {
            splitPath = ['.'];
        }

        var barsProp = splitPath.pop()
            .split('@');
        if (barsProp[0]) {
            splitPath.push(barsProp[0]);
        }
        if (barsProp[1]) {
            splitPath.push('@' + barsProp[1]);
        }
    } else {
        throw 'bad arrgument: expected String | Array<String>.';
    }

    return splitPath;
}


var Context = Generator.generate(function Context(data, fragment, path) {
    var _ = this;

    _.data = data;
    _.fragment = fragment;
    _.context = null;
    _.path = path;
    _.__path = [];

    _.props = {
        get key() {
            if (!_.path.length && _.context) {
                return _.context.props.key;
            }
            return _.path[_.path.length - 1];
        },
        get index() {
            if (!_.path.length && _.context) {
                return _.context.props.index;
            }
            return _.path[_.path.length - 1];
        }
    };
});

Context.definePrototype({
    path: {
        get: function path() {
            return this.__path || [];
        },
        set: function path(path) {
            var _ = this;

            path = pathSpliter(path);
            var fragment = _.fragment;

            _.data = null;
            _.context = null;

            if (path[0] === '~' && fragment.fragment) {

                while (fragment.fragment) {
                    fragment = fragment.fragment;
                }
                _.context = fragment.context;
                path.shift();
            } else if (path[0] === '..' && fragment.fragment &&
                fragment
                .fragment
                .fragment) {
                _.context = fragment.fragment.context;

                while (path[0] === '..' && _.context.context) {

                    path = pathResolver(_.context.path, path);

                    _.context = _.context.context;
                }
            }

            _.__path = path;
        }
    },

    lookup: function lookup(path) {
        var _ = this;

        path = pathSpliter(path);

        if (!_.context && _.fragment.fragment) {
            _.context = _.fragment.fragment.context;
        }

        if (path[0] === '~' && _.context) {
            return _.context.lookup(path);
        }

        if (path[0] === '..' && _.context) {
            return _.context.lookup(
                pathResolver(_.path, path)
            );
        }

        if (
            path[0] === 'this' ||
            path[0] === '.' ||
            path[0] === '~'
        ) {
            path.shift();
        }

        if (!_.data && _.context) {
            _.data = _.context.lookup(_.path);
        }

        if (!_.data) return;

        var value = _.data;

        for (var i = 0; value && i < path.length; i++) {

            if (path[i][0] === '@') {
                value = _.props[path[i].slice(1)];
            } else if (value !== null && value !== void(0)) {
                value = value[path[i]];
            } else {
                value = undefined;
            }
        }

        return value;
    }
});

module.exports = Context;
