var h = require('virtual-dom/h');
var execute = require('../runtime/execute');

function renderTextNode(bars, struct, context) {
    return struct.value;
}

var PROP_MAP = {
    'class': 'className'
};

function renderAttrsAndProps(bars, struct, context) {
    var props = {},
        attrs = {};

    for (var i = 0; i < struct.attrs.length; i++) {
        var attr = struct.attrs[i];

        var rendered = renderChildrenTexts(bars, attr, context);

        props[PROP_MAP[attr.name] || attr.name] = rendered;
        if (attr.name !== 'class') attrs[attr.name] = rendered;
    }

    props.attributes = attrs;
    var key = context.lookup(['@', 'key']);
    // props.key = /[^0-9]/.test(key) ? key : context.lookup(['id']);

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
        nodes.push(renderTypeAsTexts(bars, struct.consequent, new_context || context));
    }

    function alternate(new_context) {
        nodes.push(renderTypeAsTexts(bars, struct.alternate, new_context || context));
    }

    var blockFunc = bars.blocks[struct.name];

    if (typeof blockFunc !== 'function') {
        throw 'Missing Block helper: ' + struct.name;
    }

    blockFunc(
        execute(struct.expression, bars.transforms, context),
        consequent,
        alternate,
        context
    );

    return nodes.join('');
}

function renderBlockAsNodes(bars, struct, context) {
    var nodes = [];

    function consequent(new_context) {
        nodes = nodes.concat(renderTypeAsNodes(bars, struct.consequent, new_context || context));
    }

    function alternate(new_context) {
        nodes = nodes.concat(renderTypeAsNodes(bars, struct.alternate, new_context || context));
    }

    var blockFunc = bars.blocks[struct.name];

    if (typeof blockFunc !== 'function') {
        throw 'Missing Block helper: ' + struct.name;
    }

    blockFunc(
        execute(struct.expression, bars.transforms, context),
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

    var partial = bars.partials[name].struct;

    if (struct.expression) {
        context = context.newContext(
            execute(struct.expression, bars.transforms, context)
        );
    }

    return renderChildrenNodes(bars, partial.fragment, context);
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

    throw 'unknown type: ' + struct.type;
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
    throw 'unknown type: ' + struct.type;
}

function render(bars, struct, context) {
    return h(
        'div', {
            key: struct.fragment.key
        },
        renderChildrenNodes(bars, struct.fragment, context)
    );
}

module.exports = render;
