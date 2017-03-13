var Generator = require('generate-js');
var ContextN = require('./runtime/context-n');
var renderV = require('./render/render');

var diff = require('virtual-dom/diff');
var patch = require('virtual-dom/patch');
var createElement = require('virtual-dom/create-element');

function repeat(a, n) {
    n = n || 0;
    var r = '';
    for (var i = 0; i < n; i++) {
        r += a;
    }
    return r;
}

var Renderer = Generator.generate(function Renderer(bars, struct, state) {
    var _ = this;

    _.bars = bars;
    _.struct = struct;

    _.tree = renderV(_.bars, _.struct, new ContextN(state || {}), true);
    _.rootNode = createElement(_.tree);
});

Renderer.definePrototype({
    update: function update(state) {
        var _ = this;

        var newTree = renderV(_.bars, _.struct, new ContextN(state));
        var patches = diff(_.tree, newTree);
        patch(_.rootNode, patches);
        _.tree = newTree;
    },
    appendTo: function appendTo(el) {
        var _ = this;

        el.appendChild(_.rootNode);
    }
});

module.exports = Renderer;
