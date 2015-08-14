var template = '<div>Hello, {{name}}!</div>';
var data = { name: 'Reginald' };

var Generator = require('generate-js'),
    Fragment = require('./fragment');

var Bars = Generator.generate(function Bars() {
    var _ = this;

    _.defineProperties({
    });
});

Bars.definePrototype({
    compile: function compile(template) {
        var _ = this;

        _.compiled = function() {
            return Fragment.create(_);
        };

        return _;
    }
});

module.exports = Bars;

var b = Bars.create();
b.compile(template);

// <div>
//     {{#each person}}
//         <p><span>Hello</span>, {{name}}!</p>
//     {{/each}}
// </div>

// <frag>div {
//     <div>
//     <frag>persons {
//         <p><span>Hello</span>, {{name}}!</p>
//     }
//     </div>
// }

// Bars.create('')
