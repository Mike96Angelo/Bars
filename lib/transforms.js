var Generator = require('generate-js');

var Transfrom = Generator.generate(function Transfrom() {});

Transfrom.definePrototype({
    upperCase: function upperCase(a) {
        return String(a).toUpperCase();
    },
    lowerCase: function lowerCase(a) {
        return String(a).toLowerCase();
    },
    number: function number(a) {
        return Number(a);
    },
    string: function string(a) {
        return String(a);
    }
});

module.exports = Transfrom;
