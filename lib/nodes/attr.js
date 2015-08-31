var Node = require('./node');

var AttrNode = Node.generate(function AttrNode(options) {
    var _ = this;

    _.supercreate(options);

    _.defineProperties({
        $el: document.createElement('X-BARS'),
    });
    // _.value = true;
});

AttrNode.definePrototype({
    isDOM: true,
    type: 'ATTR-NODE',
    update: function(context) {
        var _ = this,
            i;
        for (i = 0; i < _.nodes.length; i++) {
            _.nodes[i].update(context);
        }

        _._elementAppendTo(_.$parent);
    },
    _elementAppendTo: function _elementAppendTo(parent) {
        var _ = this;

        if (parent instanceof Element) {
            _.$parent = parent;
            _.$parent.setAttribute(_.name, _.$el.innerHTML);

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
