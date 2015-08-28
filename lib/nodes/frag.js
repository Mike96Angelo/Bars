var Node = require('./node');

function resolve(basepath, path) {
    var splitBasepath = basepath.split('/'),
        splitPath = path.split('/');

    if (path[0] === '/') {
        splitPath.shift();
        return splitPath;
    }

    if (!basepath || basepath[0] === '/') {
        splitBasepath.shift();
    }

    while (splitPath[0] =='..') {
        splitPath.shift();
        splitBasepath.pop();
    }

    return splitBasepath.concat(splitPath);
}

/**
 * <span>hello, {{name}}.</span>
 */

var FragNode = Node.generate(function FragNode(options) {
    var _ = this;

    _.supercreate(options);

    _.data = {};
});

FragNode.definePrototype({
    type: 'FRAG-NODE',

    update: function update(data) {
        var _ = this,
            context;

        if (typeof data === 'function') {
            context = data;
        } else {
            _.data = data;
            context = _.getContext('');
        }

        for (var i = 0; i < _.nodes.length; i++) {
            _.nodes[i].update(context);
        }
    },

    _elementAppendTo: function _elementAppendTo(parent) {
        var _ = this;

        for (var i = 0; i < _.nodes.length; i++) {
            _.nodes[i]._elementAppendTo(parent);
            _.$parent = parent;
        }
    },

    _elementRemove: function _elementRemove() {
        var _ = this;

        for (var i = 0; i < _.nodes.length; i++) {
            _.nodes[i]._elementRemove();
        }
        _.$parent = null;
    },

    getValue: function getValue(splitPath) {
        var _ = this;

        var value = _.data;

        for (var i = 0; i < splitPath.length; i++) {
            if (splitPath[i] === '@key' || splitPath[i] === '@index') {
                value = splitPath[i - 1];
            } else {
                value = value[splitPath[i]];
            }
        }

        return value;
    },
    getContext: function getContext(basepath) {
        var _ = this;

        function context(path) {
            return _.getValue(resolve(basepath, path));
        }

        context.getContext = function getContext(path) {
            return _.getContext(resolve(basepath, path).join('/'));
        };

        return context;
    },
});

module.exports = FragNode;
