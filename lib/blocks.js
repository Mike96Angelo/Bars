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
            _.node[0].context.data = data;

            return true;
        }

        return false;
    },

    each: function eachBlock(data) {
        var _ = this,
            i;

        if (data && typeof data === 'object') {
            var keys = Object.keys(data);

            if (keys.length) {
                // TODO: This should be smarter.

                // remove extra nodes
                for (i = _.nodes.length - 1; i >= keys.length; i--) {
                    _.nodes[i].remove();
                }

                // add needed nodes
                for (i = _.nodes.length; i < keys.length; i++) {
                    _.createFragment(keys[i]);
                }

                // update node paths
                for (i = 0; i < keys.length; i++) {
                    // _.nodes[i].context.path = keys[i];
                    _.nodes[i].context.data = data[keys[i]];
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
            var keys = Object.keys(data)
                .reverse();

            if (keys.length) {
                // TODO: This should be smarter.

                // remove extra nodes
                for (i = _.nodes.length - 1; i >= keys.length; i--) {
                    _.nodes[i].remove();
                }

                // add needed nodes
                for (i = _.nodes.length; i < keys.length; i++) {
                    _.createFragment(keys[i]);
                }

                // update node paths
                for (i = 0; i < keys.length; i++) {
                    _.nodes[i].context.path = keys[i];
                    _.nodes[i].context.data = data[keys[i]];
                }

                return true;
            }
        }

        return false;
    }
});

module.exports = Blocks;
