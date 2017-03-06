var h = require('virtual-dom/h');
var execute = require('../runtime/execute');

function makeVars(context, map, bars) {
    var vars = {};
    for (var i = 0; i < map.length; i++) {
        vars[map[i].name] = execute(map[i].expression, bars.transforms, context);
    }
    // console.log(vars);
    return vars;
}

function renderTextNode(bars, struct, context) {
    return struct.value;
}

var PROP_MAP = {
    'class': 'className'
};

function renderAttrsAndProps(bars, struct, context) {
    var i,
        _data = {},
        props = {},
        attrs = {};

    function get(name) {
        return _data[name];
    }

    for (i = 0; i < struct.attrs.length; i++) {
        var attr = struct.attrs[i];
        attrs[attr.name] = renderChildrenTexts(bars, attr, context);
    }

    for (i = 0; i < struct.binds.length; i++) {
        _data[struct.binds[i].name] = execute(struct.binds[i].expression, bars.transforms, context);
    }

    for (i = 0; i < struct.props.length; i++) {
        props[struct.props[i].name] = execute(struct.props[i].expression, bars.transforms, context);
    }

    props.data = get;
    props.attributes = attrs;

    return props;
}

function renderInsert(bars, struct, context) {
    return execute(struct.expression, bars.transforms, context);
}

function renderChildrenTexts(bars, struct, context) {
    var children = [];
    if (!struct || !struct.nodes) return children.join('');
    for (var i = 0; i < struct.nodes.length; i++) {
        var child = struct.nodes[i];

        if (child.type === 'text') {
            children.push(child.value);
        } else if (child.type === 'insert') {
            children.push(renderInsert(bars, child, context));
        } else if (child.type === 'block') {
            children.push(renderBlockAsTexts(bars, child, context));
        }
    }

    return children.join('');
}

function renderBlockAsTexts(bars, struct, context) {
    var nodes = [];

    function consequent(new_context) {
        new_context = new_context || context;
        new_context = new_context.contextWithVars(makeVars(new_context, struct.map, bars));
        nodes.push(renderTypeAsTexts(bars, struct.consequent, new_context));
    }

    function alternate(new_context) {
        if (new_context) {
            new_context = new_context.contextWithVars(makeVars(new_context, struct.map, bars));
        }
        nodes.push(renderTypeAsTexts(bars, struct.alternate, new_context || context));
    }

    var blockFunc = bars.blocks[struct.name];

    if (typeof blockFunc !== 'function') {
        throw 'Bars Error: Missing Block helper: ' + struct.name;
    }

    blockFunc(
        struct.arguments.map(function (expression) {
            return execute(expression, bars.transforms, context);
        }),
        consequent,
        alternate,
        context
    );

    return nodes.join('');
}

function renderBlockAsNodes(bars, struct, context) {
    var nodes = [];

    function consequent(new_context) {
        new_context = new_context || context;
        new_context = new_context.contextWithVars(makeVars(new_context, struct.map, bars));
        nodes = nodes.concat(renderTypeAsNodes(bars, struct.consequent, new_context));
    }

    function alternate(new_context) {
        if (new_context) {
            new_context = new_context.contextWithVars(makeVars(new_context, struct.map, bars));
        }
        nodes = nodes.concat(renderTypeAsNodes(bars, struct.alternate, new_context || context));
    }

    var blockFunc = bars.blocks[struct.name];

    if (typeof blockFunc !== 'function') {
        throw 'Bars Error: Missing Block helper: ' + struct.name;
    }

    blockFunc(
        struct.arguments.map(function (expression) {
            return execute(expression, bars.transforms, context);
        }),
        consequent,
        alternate,
        context
    );

    return nodes;
}

function renderPartial(bars, struct, context) {
    var name = struct.name;
    if (typeof struct.name === 'object') {
        name = execute(struct.name, bars.transforms, context);
    }

    var partial = bars.partials[name];

    if (!partial) {
        throw 'Bars Error: Missing Partial: ' + name;
    }

    var newContext = context;

    if (struct.expression) {
        newContext = newContext.newContext(
            execute(struct.expression, bars.transforms, context),
            null,
            true
        );
    }

    newContext = newContext.contextWithVars(makeVars(context, struct.map, bars));

    return renderChildrenNodes(bars, partial.fragment, newContext);
}

function renderChildrenNodes(bars, struct, context) {
    var children = [];
    if (!struct || !struct.nodes) return children;
    for (var i = 0; i < struct.nodes.length; i++) {
        var child = struct.nodes[i];

        if (child.type === 'tag') {
            children.push(renderTagNode(bars, child, context));
        } else if (child.type === 'text') {
            children.push(renderTextNode(bars, child, context));
        } else if (child.type === 'insert') {
            children.push(renderInsert(bars, child, context));
        } else if (child.type === 'block') {
            children = children.concat(renderBlockAsNodes(bars, child, context));
        } else if (child.type === 'partial') {
            children = children.concat(renderPartial(bars, child, context));
        }
    }

    return children;
}

function renderTagNode(bars, struct, context) {
    return h(
        struct.name,
        renderAttrsAndProps(bars, struct, context),
        renderChildrenNodes(bars, struct, context)
    );
}

function renderTypeAsNodes(bars, struct, context) {
    if (!struct) return [];
    if (struct.type === 'tag') {
        return [renderTagNode(bars, struct, context)];
    } else if (struct.type === 'text') {
        return [renderTextNode(bars, struct, context)];
    } else if (struct.type === 'insert') {
        return [renderInsert(bars, struct, context)];
    } else if (struct.type === 'block') {
        return renderBlockAsNodes(bars, struct, context);
    } else if (struct.type === 'fragment') {
        return renderChildrenNodes(bars, struct, context);
    } else if (struct.type === 'partial') {
        return renderPartial(bars, struct, context);
    }

    throw 'Bars Error: unknown type: ' + struct.type;
}

function renderTypeAsTexts(bars, struct, context) {
    if (!struct) return [];
    if (struct.type === 'text') {
        return struct.value;
    } else if (struct.type === 'insert') {
        return renderInsert(bars, struct, context);
    } else if (struct.type === 'block') {
        return renderBlockAsTexts(bars, struct, context);
    } else if (struct.type === 'fragment') {
        return renderChildrenTexts(bars, struct, context);
    }
    throw 'Bars Error: unknown type: ' + struct.type;
}

function render(bars, struct, context, noRender) {
    return h(
        'div',
        noRender ? [] : renderChildrenNodes(bars, struct.fragment, context)
    );
}

module.exports = render;
