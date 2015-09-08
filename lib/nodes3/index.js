function UUID() {
    var d = new Date().getTime();
    var L = UUID.chars.length;
    return UUID.sequence.replace(/[xy]/g, function(c) {
        var r = (d + Math.random()*L)%L | 0;
        d = Math.floor(d/L);
        return UUID.chars[(c === 'x' ? r : (r&0x3|0x8))];
    });
}

UUID.sequence = 'xxxxyxxxxyxxxxyxxxx';
UUID.chars = '1234567890abcdef';


var struct = {
    'type': 'FRAG',
    'nodes': [
        {
            type: 'TAG',
            name: 'div',
            nodes: [
                {
                    'type': 'TEXT',
                    'blockString': ' start '
                },
                {
                    'type': 'BLOCK',
                    'name': 'reverse',
                    'blockString': 'cats',
                    'conFrag': {
                        'type': 'FRAG',
                        'nodes': [
                            {
                                'type': 'TEXT',
                                'blockString': 'name'
                            }
                        ]
                    },
                    'altFrag': {
                        'type': 'FRAG',
                        'nodes': [
                            {
                                'type': 'TEXT',
                                'content': ' altFrag '
                            },
                            // {
                            //     'type': 'BLOCK',
                            //     'name': 'if',
                            //     'blockString': 'name2',
                            //     'conFrag': {
                            //         'type': 'FRAG',
                            //         'nodes': [
                            //             {
                            //                 'type': 'TEXT',
                            //                 'content': ' NAME2 '
                            //             }
                            //         ]
                            //     },
                            //     'altFrag': {
                            //         'type': 'FRAG',
                            //         'nodes': [
                            //             {
                            //                 'type': 'TEXT',
                            //                 'content': ' noname '
                            //             }
                            //         ]
                            //     }
                            // }
                        ]
                    }
                },
                {
                    'type': 'TEXT',
                    'content': ' end '
                }
            ]
        }
    ]
};

// struct = {
//   "type": "FRAG",
//   "nodes": [
//     {
//       "type": "TAG",
//       "name": "div",
//       "nodes": [
//         {
//         "type": "TEXT",
//         "content": "123"
//         },
//         {
//           "type": "BLOCK",
//           "name": "if",
//           "blockString": "name",
//           "conFrag": {
//             "type": "FRAG",
//             "nodes": [
//               {
//                 "type": "TEXT",
//                 "content": "name"
//               }
//             ]
//           },
//           "altFrag": {
//             "type": "FRAG",
//             "nodes": [
//               {
//                 "type": "TEXT",
//                 "content": "No name"
//               }
//             ]
//           }
//         }
//       ],
//       "attrs": []
//     }
//   ]
// };

var Generator = require('generate-js');

var Node = Generator.generate(function Node(bars) {
    var _ = this;

    _.defineProperties({
        bars: bars,
        id: UUID(),
        nodes: [],
        parentTag: {
            get: _.getParentTag
        },
        prevDom: {
            get: _.getPrevDom
        }
    });
});

Node.definePrototype({
    update: function update(context) {
        var _ = this;

        _.previousDom = null;


        if (_.isDOM) {
            console.log('PREVDOM', _, _.prevDom);
            _._elementAppendTo();
            _.parentTag.previousDom = _;
        }

        _._update(context);
        _.previousDom = null;
    },

    _update: function _update() {
        console.warn('_update method not implemented.');
    },

    appendChild: function appendChild(child) {
        var _ = this;

        _.nodes.push(child);
        child.parent = _;

        // child._elementAppendTo();
    },

    appendTo: function appendTo(parent) {
        var _ = this;

        if (parent instanceof Element) {
            _._elementAppendTo(parent);
        }

        if (Node.isCreation(parent)) {
            parent.appendChild(_);
        }
    },

    remove: function remove() {
        var _ = this,
            index = _.parent.nodes.indexOf(_);

        if (index >= 0) {
            _.parent.nodes.splice(index, 1);
        }

        _._elementRemove();
    },

    getParentTag: function getParentTag() {
        var _ = this,
            parent = _.parent,
            oldParent = parent;

        while (parent && !parent.isDOM) {
            oldParent = parent;
            parent = parent.parent;
        }

        return parent || oldParent || null;
    },

    getPrevDom: function getPrevDom() {
        var _ = this;

        return (_.parentTag && _.parentTag.previousDom) || null;
    },

    _elementAppendTo: function _elementAppendTo(parent) {
        var _ = this;

        if (parent instanceof Element && _.isDOM) {
            parent.appendChild(_.$el);
        } else if (_.isDOM) {
            if (!_.parentTag) return;

            parent = _.parentTag.$el || _.parentTag.$parent;

            if (!parent) return console.log('GOT NO parent', _.type, _.parentTag);

            var prev = _.prevDom;

            if (prev) {
                parent.insertBefore(_.$el, prev.$el.nextSibling);
            } else {
                parent.appendChild(_.$el);
            }
        }
    },

    _elementRemove: function _elementRemove() {
        var _ = this;

        if (_.isDOM && _.$el.parentNode instanceof Element) {
            _.$el.parentNode.removeChild(_.$el);
        }
    },
});

module.exports = Node;

var TextNode = Node.generate(function TextNode(bars, struct, parent) {
console.log('TextNode', parent)

    var _ = this;

    _.supercreate(bars);

    _.defineProperties({
        $el: document.createTextNode(struct.content)
    });

    _.defineProperties(struct);

    if (parent) {
        parent.appendChild(_);
    }
});

TextNode.definePrototype({
    isDOM: true,

    appendChild: function appendChild(child) {
        console.warn('appendChild CANNOT be called on TextNodes.');
    },

    _update: function _update(context) {
        var _ = this;

        if (typeof _.blockString === 'string') {
            _.$el.textContent = context(_.blockString);
        }
    },
});

var TagNode = Node.generate(function TagNode(bars, struct, parent) {
console.log('TagNode', parent)

    var _ = this,
        nodes = struct.nodes,
        attrs = struct.attrs;

    delete struct.nodes;
    delete struct.attrs;

    _.supercreate(bars);


    _.defineProperties({
        $el: document.createElement(struct.name),
        attrs: []
    });

    _.defineProperties(struct);

    if (parent) {
        parent.appendChild(_);
    }

    for (var i = 0; i < nodes.length; i++) {
        var node = nodes[i];

        Nodes[node.type].create(bars, node, _);
    }

    // for (var i = 0; i < attrs.length; i++) {
    //     var attr = attrs[i];

    //     Nodes.Attr.create(bars, attr, _);
    // }
    //
});

TagNode.definePrototype({
    isDOM: true,

    _update: function _update(context) {
        var _ = this;

        for (var i = 0; i < _.nodes.length; i++) {
            _.nodes[i].update(context);
        }
    },
});

var BlockNode = Node.generate(function BlockNode(bars, struct, parent) {
    console.log('BlockNode', parent)
    var _ = this;

    _.supercreate(bars);

    _.defineProperties(struct);

    if (parent) {
        parent.appendChild(_);
    }
});

BlockNode.definePrototype({
    type: 'BLOCK-NODE',

    createFragment: function createFragment(path) {
        var _ = this,
            frag = Nodes.FRAG.create(_.bars, _.conFrag);

        frag.setPath(path);

        _.appendChild(frag);
    },

    _update: function _update(context) {
        var _ = this,
            con;

        if (typeof _.bars.blocks[_.name] === 'function') {
            _.context = context;
            con = _.bars.blocks[_.name].call(_, _.context(_.blockString));
        } else {
            throw new Error('Block helper not found: ' + _.name);
        }

        if (con) {
            if (!_.nodes.length) {
                _.createFragment();
            }

            for (var i = 0; i < _.nodes.length; i++) {
                _.nodes[i].update(_.context);
            }

            if (_.alternate) {
                _.alternate._elementRemove();
            }
        } else {
            for (var i = 0; i < _.nodes.length; i++) {
                _.nodes[i]._elementRemove();
            }
            if (!_.alternate) {
                _.alternate = Nodes.FRAG.create(_.bars, _.altFrag);
                _.alternate.parent = _;
            }

            _.alternate.update(_.context);
        }
    },
    _elementAppendTo: function _elementAppendTo() {},
    _elementRemove: function _elementRemove() {
        var _ = this,
            i;

        for (i = 0; i < _.nodes.length; i++) {
            _.nodes[i]._elementRemove();
        }

        if (_.alternate) {
            _.alternate._elementRemove();
        }
    }
});

///FRAG

function resolve(basepath, path) {
    var newSplitpath;

    if (path[0] === '/') {
        newSplitpath = path.split('/');
    } else {
        newSplitpath = basepath.split('/').concat(path.split('/'));
    }


    for (var i = 0; i < newSplitpath.length; i++) {
        if (newSplitpath[i] === '.' || newSplitpath[i] === '') {
            newSplitpath.splice(i, 1);
            i--;
        } else if (newSplitpath[i] === '..') {
            newSplitpath.splice(i - 1, 2);
            i -= 2;
        }
    }

    // console.log(newSplitpath);
    return newSplitpath;
}

var FragNode = Node.generate(function FragNode(bars, struct) {
    console.log('FragNode', struct)

    var _ = this,
        nodes = struct.nodes;

    _.supercreate(bars);

    for (var i = 0; i < nodes.length; i++) {
        var node = nodes[i];

        Nodes[node.type].create(bars, node, _);
    }
});

FragNode.definePrototype({
    _update: function _update(context) {
        var _ = this;

        if (typeof context !== 'function') {
            _.data = context;
            context = _.getContext('');
        }

        if (_.path) {
            context = context.getContext(_.path);
        }

        for (var i = 0; i < _.nodes.length; i++) {
            _.nodes[i].update(context);
        }
    },

    _elementAppendTo: function _elementAppendTo(parent) {
        var _ = this;

        _.$parent = parent;
    },
    _elementRemove: function _elementRemove() {
        var _ = this;

        for (var i = 0; i < _.nodes.length; i++) {
            _.nodes[i]._elementRemove();
        }

        _.$parent = null;
    },
    getValue: function getValue(splitPath) {
        var _ = this;

        var value = _.data;

        for (var i = 0; i < splitPath.length; i++) {
            if (splitPath[i] === '@key' || splitPath[i] === '@index') {
                value = splitPath[i - 1];
            } else if (value !== null && value !== void(0)) {
                value = value[splitPath[i]];
            } else {
                return;
            }
        }

        return value;
    },
    getContext: function getContext(basepath) {
        var _ = this;

        function context(path) {
            return _.getValue(resolve(basepath, path));
        }

        context.getContext = function getContext(path) {
            return _.getContext(resolve(basepath, path).join('/'));
        };

        return context;
    },

    setPath: function setPath(path) {
        var _ = this;

        if (path) {
            _.defineProperties({
                path: path.toString()
            });
        }
    },
});

var Nodes = {};

Nodes.FRAG = FragNode;
Nodes.TEXT = TextNode;
Nodes.TAG = TagNode;
Nodes.BLOCK = BlockNode;

var bars = {
    blocks: {},
    registerBlock: function registerBlock(name, func) {
        var _ = this;
        _.blocks[name] = func;
    },
};

bars.registerBlock('if', function(con) {
    return con;
});

bars.registerBlock('unless', function(con) {
    return !con;
});

bars.registerBlock('each', function(data) {
    var _ = this,
        i;

    if (data && typeof data === 'object') {
        var keys = Object.keys(data);

        _.context = _.context.getContext(_.blockString);

        if (keys.length) {
            for (i = _.nodes.length; i < keys.length; i++) {
                _.createFragment(keys[i]);
            }

            for (i = keys.length; i < _.nodes.length; i++) {
                _.nodes[i].remove();
            }

            return true;
        }
    }

    return false;
});

bars.registerBlock('reverse', function(data) {
    var _ = this,
        i;

    if (data && typeof data === 'object') {
        var keys = Object.keys(data).reverse();

        _.context = _.context.getContext(_.blockString);

        if (keys.length) {
            for (i = _.nodes.length; i < keys.length; i++) {
                _.createFragment(keys[i]);
            }

            for (i = keys.length; i < _.nodes.length; i++) {
                _.nodes[i].remove();
            }

            return true;
        }
    }

    return false;
});

bars.registerBlock('with', function(data) {
    var _ = this;

    if (data && typeof data === 'object') {
        _.context = _.context.getContext(_.blockString);

        return true;
    }

    return false;
});

var f = window.f = FragNode.create(bars, struct);
// f.update({name: 'mike'});
console.log('test', f);
f.appendTo(document.body);
