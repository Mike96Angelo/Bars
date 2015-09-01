var Node = require('./node');

var TextNode = Node.generate(function TextNode(options) {
    var _ = this;

    _.supercreate(options);

    _.defineProperties({
        $el: document.createTextNode(options && options.content)
    });
});

TextNode.definePrototype({
    type: 'TEXT-NODE',

    update: function update(context) {
        var _ = this,
            helper,
            args,
            content;

        if (_.name) {
            helper = _.bars.helpers[_.name];

            if (typeof helper === 'function') {
                args = _.blockString.split(/\d+/).map(function(item) {
                    return context(item);
                });

                content = helper.apply(_, args);
            } else {
                throw new Error('Helper not found: ' + _.name);
            }
        } else if (_.contextPath) {
            content = context(_.contextPath);
        } else {
            content = _.content;
        }

        if (_.isDOM || _.type === 'TEXT-NODE' && _.parentTag) {
            _.parentTag.prevDom = _.$el;
        }

        _.$el.textContent = content;
    },
});

module.exports = TextNode;
