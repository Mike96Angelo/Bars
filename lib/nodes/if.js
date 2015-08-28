var BlockNode  = require('./block');

var IfNode = BlockNode.generate(function IfNode(options) {
    var _ = this;

    _.supercreate(options);
});

IfNode.definePrototype({
    name: 'if'
});

module.exports = IfNode;
