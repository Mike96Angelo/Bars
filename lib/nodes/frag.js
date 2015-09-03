var Node = require('./node');

function resolve(basepath, path) {
    var newSplitpath;

    if (path[0] === '/') {
        newSplitpath = path.split('/');
    } else {
        newSplitpath = basepath.split('/').concat(path.split('/'));
    }


    for (var i = 0; i < newSplitpath.length; i++) {
        if (newSplitpath[i] === '.' || newSplitpath[i] === '') {
            newSplitpath.splice(i, 1);
            i--;
        } else if (newSplitpath[i] === '..') {
            newSplitpath.splice(i - 1, 2);
            i -= 2;
        }
    }

    // console.log(newSplitpath);
    return newSplitpath;
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
            context,
            helper,
            args,
            content;

        if (typeof data === 'function') {
            context = data;
        } else {
            _.data = data;
            context = _.getContext('');
        }

        if (_.path) {
            context = context.getContext(_.path);
        }

        if (_.name) {
            _.empty();
            helper = _.bars.helpers[_.name];

            if (typeof helper === 'function') {
                args = _.blockString.split(/\s+/).map(function(item) {
                    return context(item);
                });
                content = helper.apply(_, args);

                if (content === null || content === void(0)) {
                    content = '';
                } else {
                    content = '' + content;
                }

                content = _.bars.compile(content).render(context);

                _.appendChild(content);
            } else {
                throw new Error('Helper not found: ' + _.name);
            }
        } else if (_.contextPath) {
            _.empty();
            content =  context(_.contextPath);

            if (content === null || content === void(0)) {
                content = '';
            } else {
                content = '' + content;
            }

            content = _.bars.compile(content).render(context);
            _.appendChild(content);
            _._elementAppendTo(_.$parent);
        } else {
            for (var i = 0; i < _.nodes.length; i++) {
                _.nodes[i].update(context);
            }
        }
    },

    _elementAppendTo: function _elementAppendTo(parent) {
        var _ = this;

        _.$parent = parent;

        for (var i = 0; i < _.nodes.length; i++) {
            _.nodes[i]._elementAppendTo(parent);
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
            } else if (value !== null && value !== void(0)) {
                value = value[splitPath[i]];
            } else {
                return;
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

    setPath: function setPath(path) {
        var _ = this;

        _.defineProperties({
            path: path
        });
    },
});

module.exports = FragNode;
