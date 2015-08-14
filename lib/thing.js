var CustomElement = require('generate-js-custom-element');

var config = {
    templates: {
        index: 'Hello, {{name}}.'
    }
};

var Thing = CustomElement.generate(function Thing($element) {
    var _ = this;

    _.supercreate($element, config);
    _.render();
});

Thing.definePrototype({
});

module.exports = Thing;
