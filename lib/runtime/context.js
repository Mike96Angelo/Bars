var Generator = require('generate-js');
var utils = require('./utils');
var pathSpliter = utils.pathSpliter;
var pathResolver = utils.pathResolver;

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

            // path = pathSpliter(path);
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
        var _ = this,
            i = 0;

        // path = pathSpliter(path);
        // console.log('lookup:', path)

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
            path[0] === '~' ||
            path[0] === '@'
        ) {
            i = 1;
        }

        if (!_.data && _.context) {
            _.data = _.context.lookup(_.path);
        }

        if (!_.data) return;

        var value = (path[0] === '@' ? _.props : _.data);

        // console.log('lookup:', value)


        for (; value && i < path.length; i++) {

            if (value !== null && value !== void(0)) {
                value = value[path[i]];
            } else {
                value = undefined;
            }
        }
        // console.log('lookup:', value)

        return value;
    }
});

module.exports = Context;
