var Generator = require('generate-js');

var EventEmitter = require('events')
    .EventEmitter;
var utils = require('compileit/lib/utils');

var Interactions = require('./interactions');

var registerBarsOptions = require('./register-bars-options');

var App = Generator.generateFrom(
    EventEmitter,
    function App(options, state) {
        var _ = this;

        console.warn(
            'app.on has been repurposed for app events to access view/DOM events use app.view.on instead.\nhttps://github.com/Mike96Angelo/Bars/blob/master/docs/js-interface.md#appview'
        );

        EventEmitter.call(_);

        _.state = state;
        _.bars = new App.Bars();
        registerBarsOptions(_.bars, options);

        var indexTemplate;

        if (typeof options.index === 'string') {
            if (!_.bars.preCompile) {
                throw 'partials must be pre-compiled using bars.preCompile(template)';
            }
            indexTemplate = _.bars.preCompile(options.index, 'index', null, {
                minify: true
            });
        } else {
            indexTemplate = options.index;
        }

        _.dom = _.bars.build(indexTemplate, _.state);

        _.view = new Interactions(_.dom.rootNode);
        _.document = new Interactions(document);
        _.window = new Interactions(window);
    }
);

App.definePrototype({
    render: function render() {
        var _ = this;

        _.dom.update(_.state);
        _.emit('render');
    },
    appendTo: function appendTo(element) {
        var _ = this;

        utils.assertError(
            element &&
            Interactions.$(element)[0] instanceof Element,
            'Option element must be of type Element or a valid css selector.'
        );

        _.dom.appendTo(Interactions.$(element)[0]);
        _.emit('append');
    }
});

module.exports = App;
