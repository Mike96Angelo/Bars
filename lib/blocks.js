var Generator = require('generate-js');

var Blocks = Generator.generate(function Blocks() {});

Blocks.definePrototype({
    if: function ifBlock(con) {
        return con;
    },

    unless: function unlessBlock(con) {
        return !con;
    },

    with: function withBlock(data) {
        var _ = this;

        if (data && typeof data === 'object') {
            _.context = _.context.getContext(_.arg.path);

            return true;
        }

        return false;
    },

    each: function eachBlock(data) {
        var _ = this,
            i;

        if (data && typeof data === 'object') {
            var keys = Object.keys(data);

            _.context = _.context.getContext(_.arg.path);

            if (keys.length) {
                // TODO: This should be smarter.

                for (i = _.nodes.length - 1; i >= 0; i--) {
                    _.nodes[i].remove();
                }

                for (i = 0; i < keys.length; i++) {
                    _.createFragment(keys[i]);
                }

                return true;
            }
        }

        return false;
    },

    reverse: function reverseBlock(data) {
        var _ = this,
            i;

        if (data && typeof data === 'object') {
            var keys = Object.keys(data).reverse();

            _.context = _.context.getContext(_.arg.path);

            if (keys.length) {
                // TODO: This should be smarter.

                for (i = _.nodes.length - 1; i >= 0; i--) {
                    _.nodes[i].remove();
                }

                for (i = 0; i < keys.length; i++) {
                    _.createFragment(keys[i]);
                }

                return true;
            }
        }

        return false;
    }
});

module.exports = Blocks;
