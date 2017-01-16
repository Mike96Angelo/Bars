var execute = require('../runtime/execute');

function makeVars(context, map, bars) {
    var vars = {};
    for (var i = 0; i < map.length; i++) {
        vars[map[i].name] = execute(map[i].expression, bars.transforms, context);
    }
    // console.log(vars);
    return vars;
}

function repeat(a, n) {
    n = n || 0;
    var r = '';
    for (var i = 0; i < n; i++) {
        r += a;
    }
    return r;
}

function abb(token, indentWith, bars, context) {
    var r = '';

    function consequent(new_context) {
        new_context = new_context || context;
        new_context = new_context.contextWithVars(makeVars(new_context, token.map, bars));
        r += ac(token.consequent.nodes, indentWith, bars, new_context);
    }

    function alternate(new_context) {
        if (new_context) {
            new_context = new_context.contextWithVars(makeVars(new_context, token.map, bars));
        }
        r += ac(token.alternate.nodes, indentWith, bars, new_context || context);
    }

    var blockFunc = bars.blocks[token.name];

    if (typeof blockFunc !== 'function') {
        throw 'Missing Block helper: ' + token.name;
    }

    blockFunc(
        token.arguments.map(function (expression) {
            return execute(expression, bars.transforms, context);
        }),
        consequent,
        alternate,
        context
    );

    return r;
}

function ac(tokens, indentWith, bars, context) {
    if (tokens.length === 0) {
        return '';
    }

    var r = '="';

    for (var i = 0; i < tokens.length; i++) {
        var token = tokens[i];
        if (token.type === 'text') {
            r += token.value;
        } else if (token.type === 'insert') {
            var val = execute(token.expression, bars.transforms, context);
            r += val !== void(0) ? val : '';
        } else if (token.type === 'block') {
            r += abb(token, indentWith, bars, context);
        }
    }

    r += '"';

    return r;
}

function a(token, indentWith, bars, context) {
    var r = ' ';
    r += token.name;
    r += ac(token.nodes, indentWith, bars, context);

    return r;
}

function hbb(token, indentWith, indent, bars, context) {
    var r = '';

    function consequent(new_context) {
        new_context = new_context || context;
        new_context = new_context.contextWithVars(makeVars(new_context, token.map, bars));
        r += hc(token.consequent.nodes, indentWith, indent, bars, new_context);
    }

    function alternate(new_context) {
        if (new_context) {
            new_context = new_context.contextWithVars(makeVars(new_context, token.map, bars));
        }
        r += hc(token.alternate.nodes, indentWith, indent, bars, new_context || context);
    }

    var blockFunc = bars.blocks[token.name];

    if (typeof blockFunc !== 'function') {
        throw 'Missing Block helper: ' + token.name;
    }

    blockFunc(
        token.arguments.map(function (expression) {
            return execute(expression, bars.transforms, context);
        }),
        consequent,
        alternate,
        context
    );

    return r;
}

function hbp(token, indentWith, indent, bars, context) {
    var name = token.name;
    if (typeof token.name === 'object') {
        name = execute(token.name, bars.transforms, context);
    }

    var partial = bars.partials[name];

    if (token.expression) {
        context = context.newContext(
            execute(token.expression, bars.transforms, context),
            null,
            true
        );
    }

    context = context.contextWithVars(makeVars(context, token.map, bars));

    return hc(partial.fragment.nodes, indentWith, indent, bars, context);
}

function hc(tokens, indentWith, indent, bars, context) {
    if (tokens.length === 0) {
        return '';
    }
    var val;
    if (tokens.length === 1) {
        if (tokens[0].type === 'text') {
            return tokens[0].value;
        } else if (tokens[0].type === 'insert') {
            val = execute(tokens[0].expression, bars.transforms, context);
            return val !== void(0) ? val : '';
        }
    }

    var r = '\n';

    for (var i = 0; i < tokens.length; i++) {
        var token = tokens[i];
        r += repeat(indentWith, indent + 1);
        if (token.type === 'tag') {
            r += h(token, indentWith, indent + 1, bars, context);
        } else if (token.type === 'text') {
            r += token.value;
        } else if (token.type === 'insert') {
            val = execute(token.expression, bars.transforms, context);
            r += val !== void(0) ? val : '';
        } else if (token.type === 'block') {
            r += hbb(token, indentWith, indent, bars, context);
        } else if (token.type === 'partial') {
            r += hbp(token, indentWith, indent, bars, context);
        }
    }

    r += repeat(indentWith, indent);

    return r;
}

function h(token, indentWith, indent, bars, context) {
    var r = '';

    r += '<' + token.name;

    for (var i = 0; i < token.attrs.length; i++) {
        r += a(token.attrs[i], indentWith, bars, context);
    }

    if (token.isSelfClosing || token.selfClosed) {
        r += ' />';
    } else {
        r += '>';

        r += hc(token.nodes, indentWith, indent, bars, context);

        r += '</' + token.name + '>';
    }

    r += '\n';

    return r;
}

function render(fragment, indentWith, bars, context) {
    return hc(fragment.nodes, indentWith, -1, bars, context);
}

module.exports = render;
