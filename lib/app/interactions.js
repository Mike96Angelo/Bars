var Generator = require('generate-js');
var $ = require('jquery');

var Ineractions = Generator.generate(function Ineractions(el) {
    var _ = this;

    _.$element = $(el);
});

Ineractions.$ = $;

Ineractions.definePrototype({
    __eventListener: function eventListener(listener) {
        var _ = this;

        return function (event) {
            $target = $(this);
            $target.data = $target.prop('data');
            return listener.call(_, event, $target);
        };
    },
    on: function on(events, target, listener) {
        var _ = this;

        if (listener) {
            _.$element.on(events, target, _.__eventListener(listener));
        } else {
            _.$element.on(events, _.__eventListener(target));
        }
    },
    // off: function off(events, target) {
    //     var _ = this;
    //
    //     _.$el.off(events, target);
    // }
});

module.exports = Ineractions;
