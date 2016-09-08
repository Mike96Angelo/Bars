var Generator = require('generate-js');

var Transfrom = Generator.generate(function Transfrom() {});

Transfrom.definePrototype({
    upperCase: function upperCase(a) {
        return ('' + a).toUpperCase();
    },
    lowerCase: function lowerCase(a) {
        return ('' + a).toLowerCase();
    },
    Number: function Number(a) {
        return +a;
    },
    String: function String(a) {
        return '' + a;
    }
});

module.exports = Transfrom;
