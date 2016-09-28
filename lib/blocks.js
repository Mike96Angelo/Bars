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
            _.context = _.context.newContext(data);

            return true;
        }

        return false;
    },

    each: function eachBlock(data) {
        var _ = this,
            i;

        if (data && typeof data === 'object') {
            var keys = Object.keys(data);

            _.context = _.context.newContext(data);

            if (keys.length) {
                // TODO: This should be smarter.

                // remove extra nodes
                for (i = _.nodes.length - 1; i >= keys.length; i--) {
                    _.nodes[i].remove();
                    var r = true;
                }

                // console.log('remove', r, keys.length, _.nodes.length)

                // update node paths
                for (i = 0; i < keys.length && i < _.nodes.length; i++) {
                    _.nodes[i].path = keys[i];
                    var u = true;
                }

                // console.log('update', u, keys.length, _.nodes.length)

                // add needed nodes
                for (i = _.nodes.length; i < keys.length; i++) {
                    _.createFragment(keys[i]);
                    var a = true;
                }

                // console.log('add', a, keys.length, _.nodes.length)

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

            _.context = _.context.newContext(data);

            if (keys.length) {
                // TODO: This should be smarter.

                // remove extra nodes
                for (i = _.nodes.length - 1; i >= keys.length; i--) {
                    _.nodes[i].remove();
                    var r = true;
                }

                // update node paths
                for (i = 0; i < keys.length && i < _.nodes.length; i++) {
                    _.nodes[i].path = keys[i];
                    var u = true;
                }

                // add needed nodes
                for (i = _.nodes.length; i < keys.length; i++) {
                    _.createFragment(keys[i]);
                    var a = true;
                }

                return true;
            }
        }

        return false;
    }
});

module.exports = Blocks;
