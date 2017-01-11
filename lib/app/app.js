var Generator = require('generate-js');
var utils = require('compileit/lib/utils');

var Ineractions = require('./interactions');

var registerBarsOptions = require('./register-bars-options');

var App = Generator.generate(function App(options, state) {
    var _ = this;

    utils.assertError(
        options.element &&
        Ineractions.$(options.element)[0] instanceof Element,
        'Option element must be of type Element or a valid css selector.'
    );

    _.state = state;
    _.bars = new App.Bars();
    registerBarsOptions(_.bars, options);

    var indexTemplate;

    if (typeof options.index === 'string') {
        if (!_.bars.preCompile) {
            throw 'partials must be pre-compiled using bars.preCompile(template)';
        }
        indexTemplate = _.bars.preCompile(options.index);
    } else {
        indexTemplate = options.index;
    }

    _.dom = _.bars.build(indexTemplate, _.state);

    _.dom.appendTo(Ineractions.$(options.element)[0]);
    _.interactions = new Ineractions(options.element);
});

App.definePrototype({
    on: function on(events, target, lintener) {
        var _ = this;

        _.interactions.on(events, target, lintener);
    },
    off: function off(events, target, lintener) {
        var _ = this;

        _.interactions.off(events, target, lintener);
    },
    render: function render() {
        var _ = this;

        _.dom.update(_.state);
    }
});

module.exports = App;
