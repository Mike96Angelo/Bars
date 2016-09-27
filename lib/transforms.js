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
    },
    sort: function sort(arr, key) {
        return arr.sort(function (a, b) {
            if (key) {
                if (a[key] < b[key]) return -1;
                if (a[key] > b[key]) return  1;
                return 0;
            }

            if (a < b) return -1;
            if (a > b) return  1;
            return 0;
        });
    }
});

module.exports = Transfrom;
