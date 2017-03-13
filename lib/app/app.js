var Generator = require('generate-js');

var PACKAGE_JSON = require('../../package.json');

var EventEmitter = require('events')
    .EventEmitter;
var utils = require('compileit/lib/utils');

var Interactions = require('./interactions');

var registerBarsOptions = require('./register-bars-options');

var App = Generator.generateFrom(
    EventEmitter,
    function App(options, state) {
        var _ = this;

        EventEmitter.call(_);

        _.state = state;
        _.bars = new App.Bars();
        registerBarsOptions(_.bars, options);

        if (typeof options.index === 'string') {
            if (!_.bars.preCompile) {
                throw 'partials must be pre-compiled using bars.preCompile(template)';
            }
            _.indexTemplate = _.bars.preCompile(options.index, 'index', null, {
                minify: true
            });
        } else {
            _.indexTemplate = options.index;
        }

        _.dom = _.bars.build(_.indexTemplate, _.state);

        _.view = new Interactions(_.element);
        _.document = new Interactions(document);
        _.window = new Interactions(window);
    }
);

App.definePrototype({
    version: PACKAGE_JSON.version,
    render: function render() {
        var _ = this;

        _.emit('before-render');
        _.dom.update(_.state);
        _.emit('render');
        setTimeout(function () {
            _.emit('after-render');
        }, 0);
    },
    appendTo: function appendTo(element) {
        var _ = this;

        utils.assertError(
            element &&
            Interactions.$(element)[0] instanceof Element,
            'Option element must be of type Element or a valid css selector.'
        );

        _.emit('before-append');
        _.dom.appendTo(Interactions.$(element)[0]);
        _.emit('append');
        setTimeout(function () {
            _.emit('after-append');
        }, 0);

        _.render();
    }
});

module.exports = App;
