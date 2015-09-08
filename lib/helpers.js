var Generator = require('generate-js');

var Helpers = Generator.generate(function Helpers() {});

Helpers.definePrototype({
    log: function log() {
        console.log.apply(console, arguments);
    }
});

module.exports = Helpers;
