var Node = require('./node');

var AttrNode = Node.generate(function AttrNode(options) {
    var _ = this;

    _.supercreate(options);

    // _.value = true;
});

AttrNode.definePrototype({
    type: 'ATTR-NODE',
    _elementAppendTo: function _elementAppendTo(parent) {
        var _ = this;

        if (parent instanceof Element) {
            _.$parent = parent;
            _.$parent.setAttribute(_.name, _.value);

        }
    },
    _elementRemove: function _elementRemove() {
        var _ = this;

        if (_.$parent instanceof Element) {
            _.$parent.removeAttribute(_.name);
        }
    }
});

module.exports = AttrNode;
