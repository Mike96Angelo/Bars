(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.Bars = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports = require('../lib/bars-runtime');

},{"../lib/bars-runtime":2}],2:[function(require,module,exports){
var Generator = require('generate-js'),
    Renderer = require('./renderer'),
    Token = require('./compiler/tokens'),
    Blocks = require('./blocks'),
    Transform = require('./transforms'),
    packageJSON = require('../package');

var Bars = Generator.generate(function Bars() {
    var _ = this;

    _.defineProperties({
        blocks: new Blocks(),
        partials: {},
        transforms: new Transform()
    });
});

Bars.definePrototype({
    version: packageJSON.version,
    build: function build(parsedTemplate, state) {
        var _ = this,
            program = parsedTemplate;

        if (Array.isArray(parsedTemplate)) {
            program = new Token.tokens.program();

            program.fromArray(parsedTemplate);
        }

        return new Renderer(_, program, state);
    },

    registerBlock: function registerBlock(name, block) {
        var _ = this;

        _.blocks[name] = block;
    },

    registerPartial: function registerPartial(name, compiledTemplate) {
        var _ = this;

        if (typeof compiledTemplate === 'string') {
            if (!_.preCompile) {
                throw 'partials must be pre-compiled using bars.preCompile(template)';
            }
            compiledTemplate = _.preCompile(compiledTemplate, name, null, {
                minify: true
            });
        }

        var program = compiledTemplate;

        if (Array.isArray(compiledTemplate)) {
            program = new Token.tokens.program();

            program.fromArray(compiledTemplate);
        }

        _.partials[name] = program;
    },

    registerTransform: function registerTransform(name, func) {
        var _ = this;

        _.transforms[name] = func;
    },
});

module.exports = Bars;

},{"../package":65,"./blocks":3,"./compiler/tokens":8,"./renderer":30,"./transforms":34,"generate-js":42}],3:[function(require,module,exports){
var Generator = require('generate-js');

var Blocks = Generator.generate(function Blocks() {});

Blocks.definePrototype({
    if: function ifBlock(args, consequent, alternate, context) {
        if (args[0]) {
            consequent();
        } else {
            alternate();
        }
    },

    with: function withBlock(args, consequent, alternate, context) {
        var _ = this,
            data = args[0];

        if (!args.length) {
            consequent();
        } else if (data && typeof data === 'object') {
            consequent(context.newContext(data));
        } else {
            alternate();
        }
    },

    each: function eachBlock(args, consequent, alternate, context) {
        var _ = this,
            data = args[0];

        if (data && typeof data === 'object') {
            var keys = Object.keys(data);

            if (keys.length) {
                for (var i = 0; i < keys.length; i++) {
                    consequent(
                        context.newContext(
                            data[keys[i]], {
                                key: keys[i],
                                index: i,
                                length: keys.length
                            }
                        )
                    );
                }
            } else {
                alternate();
            }
        } else {
            alternate();
        }
    }
});

module.exports = Blocks;

},{"generate-js":42}],4:[function(require,module,exports){
var Token = require('./token');

var AssignmentToken = Token.generate(
    function AssignmentToken(code) {
        var _ = this;

        if (code) {
            Token.call(_, code);
        }

        _.name = '';

        _.expression = null;
    }
);


AssignmentToken.definePrototype({
    enumerable: true
}, {
    type: 'assignment'
});

AssignmentToken.definePrototype({
    TYPE_ID: Token.tokens.push(AssignmentToken) - 1,
    toArray: function () {
        var _ = this;
        return [
            _.TYPE_ID,
            _.name,
            _.expression
        ];
    },

    toObject: function () {
        var _ = this;
        return {
            type: _.type,
            TYPE_ID: _.TYPE_ID,
            name: _.name,
            expression: _.expression
        };
    },

    _fromArray: function _fromArray(arr) {
        var _ = this;

        _.name = arr[1];

        _.expression = new Token.tokens[arr[2][0]]();

        _.expression.fromArray(arr[2]);
    },

    toString: function toString() {
        // var _ = this,
        //     str = '';
        //
        // if (_.operands.length === 1) {
        //     str += _.assignment + _.operands[0].toString();
        // } else if (_.operands.length === 2) {
        //     str += _.operands[0].toString();
        //     str += ' ' + _.assignment + ' ';
        //     str += _.operands[1].toString();
        // }
        //
        // return str;
    }
});

Token.tokens.assignment = AssignmentToken;

},{"./token":17}],5:[function(require,module,exports){
var Token = require('./token');

var AttrToken = Token.generate(
    function AttrToken(code) {
        var _ = this;

        if (code) {
            Token.call(_, code);
        }

        _.name = '';

        _.nodes = [];

        _.nodesUpdate = 0;
    }
);


AttrToken.definePrototype({
    enumerable: true
}, {
    type: 'attr'
});

AttrToken.definePrototype({
    TYPE_ID: Token.tokens.push(AttrToken) - 1,
    toArray: function () {
        var _ = this;
        return [
            _.TYPE_ID,
            _.name,
            _.nodes,
            _.nodesUpdate
        ];
    },

    toObject: function () {
        var _ = this;
        return {
            type: _.type,
            TYPE_ID: _.TYPE_ID,
            name: _.name,
            nodes: _.nodes,
            nodesUpdate: _.nodesUpdate
        };
    },

    _fromArray: function _fromArray(arr) {
        var _ = this;

        _.name = arr[1];

        _.nodes = arr[2].map(function (item) {
            var node = new Token.tokens[item[0]]();

            node.fromArray(item);

            return node;
        });

        _.nodesUpdate = arr[3];
    },

    toString: function toString() {
        var _ = this,
            str = ' ';

        str += _.name + (_.nodes.length ? '="' : '');

        for (var i = 0; i < _.nodes.length; i++) {

            _.nodes[i].indentLevel = '';

            str += _.nodes[i].toString();
        }

        str += (_.nodes.length ? '"' : '');

        return str;
    },
    updates: function updates() {
        var _ = this;

        _.nodesUpdate = 1;
    }
});

Token.tokens.attr = AttrToken;

},{"./token":17}],6:[function(require,module,exports){
var Token = require('./token');

var BlockToken = Token.generate(
    function BlockToken(code) {
        var _ = this;

        if (code) {
            Token.call(_, code);
        }

        _.name = '';

        _.arguments = null;
        _.map = null;

        _.consequent = null;
        _.alternate = null;
    }
);


BlockToken.definePrototype({
    enumerable: true
}, {
    type: 'block'
});

BlockToken.definePrototype({
    TYPE_ID: Token.tokens.push(BlockToken) - 1,
    toArray: function () {
        var _ = this;
        return [
            _.TYPE_ID,
            _.name,
            _.arguments,
            _.map,
            _.consequent,
            _.alternate
        ];
    },

    toObject: function () {
        var _ = this;
        return {
            type: _.type,
            TYPE_ID: _.TYPE_ID,
            name: _.name,
            arguments: _.arguments,
            map: _.map,
            consequent: _.consequent,
            alternate: _.alternate
        };
    },

    _fromArray: function _fromArray(arr) {
        var _ = this;

        _.name = arr[1];

        _.arguments = arr[2].map(function (item) {
            var arg = new Token.tokens[item[0]]();

            arg.fromArray(item);

            return arg;
        });

        _.map = arr[3].map(function (item) {
            var arg = new Token.tokens[item[0]]();

            arg.fromArray(item);

            return arg;
        });

        var consequent = new Token.tokens.fragment();

        consequent.fromArray(arr[4]);

        _.consequent = consequent;

        if (arr[5]) {
            var alternate = new Token.tokens[arr[5][0]]();

            alternate.fromArray(arr[5]);

            _.alternate = alternate;
        }
    },

    toString: function toString() {
        var _ = this,
            str = '';

        if (!_.fromElse) {
            str += _.indentLevel + '{{#';
        }

        str += _.name + ' ';

        str += _.expression.toString();
        str += (_.map ? _.map.toString() : '');

        str += '}}';

        _.consequent.indentLevel = (_.indentLevel ? _.indentLevel +
            '  ' : '');
        str += _.consequent.toString();

        if (_.alternate) {
            _.alternate.indentLevel = _.indentLevel;
            if (_.alternate.type === 'block') {
                _.alternate.fromElse = true;
                str += _.indentLevel + '{{else ' + _.alternate.toString();
                return str;
            }
            _.alternate.indentLevel += (_.indentLevel ? _.indentLevel +
                '  ' : '');

            str += _.indentLevel + '{{else}}';
            str += _.alternate.toString();
        }

        str += _.indentLevel + '{{/' + _.name + '}}';

        return str;
    },
    updates: function updates() {
        var _ = this;

        if (_.elsed && _.alternate) {
            _.alternate.nodesUpdate = 1;
        } else if (_.consequent) {
            _.consequent.nodesUpdate = 1;
        }
    }
});

Token.tokens.block = BlockToken;

},{"./token":17}],7:[function(require,module,exports){
var Token = require('./token');

var FragmentToken = Token.generate(
    function FragmentToken(code) {
        var _ = this;

        if (code) {
            Token.call(_, code);
        }

        _.nodes = [];

        _.nodesUpdate = 0;
    }
);


FragmentToken.definePrototype({
    enumerable: true
}, {
    type: 'fragment'
});

FragmentToken.definePrototype({
    TYPE_ID: Token.tokens.push(FragmentToken) - 1,
    toArray: function () {
        var _ = this;
        return [
            _.TYPE_ID,
            _.nodes,
            _.nodesUpdate
        ];
    },

    toObject: function () {
        var _ = this;
        return {
            type: _.type,
            TYPE_ID: _.TYPE_ID,
            nodes: _.nodes,
            nodesUpdate: _.nodesUpdate
        };
    },

    _fromArray: function _fromArray(arr) {
        var _ = this;

        _.nodes = arr[1].map(function (item) {
            var node = new Token.tokens[item[0]]();

            node.fromArray(item);

            return node;
        });

        _.nodesUpdate = arr[2];
    },

    toString: function toString() {
        var _ = this,
            str = '';

        for (var i = 0; i < _.nodes.length; i++) {
            _.nodes[i].indentLevel = _.indentLevel;
            str += _.nodes[i].toString();
        }

        return str;
    },
    updates: function updates() {
        var _ = this;

        _.nodesUpdate = 1;
    }
});

Token.tokens.fragment = FragmentToken;

},{"./token":17}],8:[function(require,module,exports){
var Token = require('./token');

// program
require('./program');
require('./fragment');

// html markup
require('./text');
require('./tag');
require('./attr');
require('./prop');

// bars markup
require('./block');
require('./insert');
require('./partial');

// bars expression
require('./literal');
require('./value');
require('./transform');
require('./operator');

// context-maps
require('./assignment');

module.exports = Token;
// module.exports = window.Token = Token;




// test

// var prog = new Token.tokens.program();
//
// prog.fragment = new Token.tokens.fragment();
//
// for (var i = 0; i < 5; i++) {
//     prog.fragment.nodes.push(new Token.tokens.tag());
// }

// window.prog = prog;

},{"./assignment":4,"./attr":5,"./block":6,"./fragment":7,"./insert":9,"./literal":10,"./operator":11,"./partial":12,"./program":13,"./prop":14,"./tag":15,"./text":16,"./token":17,"./transform":18,"./value":19}],9:[function(require,module,exports){
var Token = require('./token');

var InsertToken = Token.generate(
    function InsertToken(code) {
        var _ = this;

        if (code) {
            Token.call(_, code);
        }

        _.expression = null;
    }
);


InsertToken.definePrototype({
    enumerable: true
}, {
    type: 'insert'
});

InsertToken.definePrototype({
    TYPE_ID: Token.tokens.push(InsertToken) - 1,
    toArray: function () {
        var _ = this;
        return [
            _.TYPE_ID,
            _.expression
        ];
    },

    toObject: function () {
        var _ = this;
        return {
            type: _.type,
            TYPE_ID: _.TYPE_ID,
            expression: _.expression
        };
    },

    _fromArray: function _fromArray(arr) {
        var _ = this;

        var expression = new Token.tokens[arr[1][0]]();

        expression.fromArray(arr[1]);

        _.expression = expression;
    },

    toString: function toString() {
        var _ = this,
            str = '{{ ';
        str += _.expression.toString();
        str += ' }}';
        return str;
    }
});

Token.tokens.insert = InsertToken;

},{"./token":17}],10:[function(require,module,exports){
var Token = require('./token');

var LiteralToken = Token.generate(
    function LiteralToken(code) {
        var _ = this;

        if (code) {
            Token.call(_, code);
        }

        _.value = '';
    }
);


LiteralToken.definePrototype({
    enumerable: true
}, {
    type: 'literal'
});

LiteralToken.definePrototype({
    TYPE_ID: Token.tokens.push(LiteralToken) - 1,
    toArray: function () {
        var _ = this;
        return [
            _.TYPE_ID,
            _.value
        ];
    },

    toObject: function () {
        var _ = this;
        return {
            type: _.type,
            TYPE_ID: _.TYPE_ID,
            value: _.value
        };
    },

    _fromArray: function _fromArray(arr) {
        var _ = this;

        _.value = arr[1];
    },
    toString: function toString() {
        var _ = this,
            str = '';

        str += _.value;

        return str;
    }
});

Token.tokens.literal = LiteralToken;

},{"./token":17}],11:[function(require,module,exports){
var Token = require('./token');

var OperatorToken = Token.generate(
    function OperatorToken(code) {
        var _ = this;

        if (code) {
            Token.call(_, code);
        }

        _.operator = '';

        _.operands = [];
    }
);


OperatorToken.definePrototype({
    enumerable: true
}, {
    type: 'operator'
});

OperatorToken.definePrototype({
    TYPE_ID: Token.tokens.push(OperatorToken) - 1,
    toArray: function () {
        var _ = this;
        return [
            _.TYPE_ID,
            _.operator,
            _.operands
        ];
    },

    toObject: function () {
        var _ = this;
        return {
            type: _.type,
            TYPE_ID: _.TYPE_ID,
            operator: _.operator,
            operands: _.operands
        };
    },

    _fromArray: function _fromArray(arr) {
        var _ = this;

        _.operator = arr[1];

        _.operands = arr[2].map(function (item) {
            var arg = new Token.tokens[item[0]]();

            arg.fromArray(item);

            return arg;
        });
    },

    toString: function toString() {
        var _ = this,
            str = '';

        if (_.operands.length === 1) {
            str += _.operator + _.operands[0].toString();
        } else if (_.operands.length === 2) {
            str += _.operands[0].toString();
            str += ' ' + _.operator + ' ';
            str += _.operands[1].toString();
        }

        return str;
    }
});

Token.tokens.operator = OperatorToken;
Token;

},{"./token":17}],12:[function(require,module,exports){
var Token = require('./token');

var PartialToken = Token.generate(
    function PartialToken(code) {
        var _ = this;

        if (code) {
            Token.call(_, code);
        }

        _.name = '';

        _.expression = null;
        _.map = null;
    }
);


PartialToken.definePrototype({
    enumerable: true
}, {
    type: 'partial'
});

PartialToken.definePrototype({
    TYPE_ID: Token.tokens.push(PartialToken) - 1,
    toArray: function () {
        var _ = this;
        return [
            _.TYPE_ID,
            _.name,
            _.expression,
            _.map
        ];
    },

    toObject: function () {
        var _ = this;
        return {
            type: _.type,
            TYPE_ID: _.TYPE_ID,
            name: _.name,
            expression: _.expression,
            map: _.map
        };
    },

    _fromArray: function _fromArray(arr) {
        var _ = this;

        _.name = arr[1];

        if (arr[2]) {
            var expression = new Token.tokens[arr[2][0]]();

            expression.fromArray(arr[2]);

            _.expression = expression;
        }

        _.map = arr[3].map(function (item) {
            var arg = new Token.tokens[item[0]]();

            arg.fromArray(item);

            return arg;
        });
    },
    toString: function toString() {
        var _ = this,
            str = _.indentLevel + '{{>' + _.name;
        str += (_.expression ? ' ' + _.expression.toString() : '');
        str += '}}';
        return str;
    }
});

Token.tokens.partial = PartialToken;

},{"./token":17}],13:[function(require,module,exports){
var Token = require('./token');
var PACKAGE_JSON = require('../../../package');

var ProgramToken = Token.generate(
    function ProgramToken(code) {
        var _ = this;

        if (code) {
            Token.call(_, code);
        }

        _.version = PACKAGE_JSON.version;
        _.mode = '';

        _.fragment = null;
    }
);

ProgramToken.definePrototype({
    enumerable: true
}, {
    type: 'program'
});

ProgramToken.definePrototype({
    writable: true
}, {
    indentLevel: '\n'
});

ProgramToken.definePrototype({
    TYPE_ID: Token.tokens.push(ProgramToken) - 1,
    toArray: function () {
        var _ = this;
        return [
            _.TYPE_ID,
            _.version,
            _.mode,
            _.fragment
        ];
    },

    toObject: function () {
        var _ = this;
        return {
            type: _.type,
            TYPE_ID: _.TYPE_ID,
            version: _.version,
            mode: _.mode,
            fragment: _.fragment
        };
    },

    _fromArray: function _fromArray(arr) {
        var _ = this;

        _.version = arr[1];
        _.mode = arr[2];

        var fragment = new Token.tokens.fragment();

        fragment.fromArray(arr[3]);

        _.fragment = fragment;
    },
    toString: function toString() {
        var _ = this;

        _.fragment.indentLevel = _.indentLevel;

        return _.fragment.toString()
            .trim() + '\n';
    }
});

Token.tokens.program = ProgramToken;

},{"../../../package":65,"./token":17}],14:[function(require,module,exports){
var Token = require('./token');

var PropToken = Token.generate(
    function PropToken(code) {
        var _ = this;

        if (code) {
            Token.call(_, code);
        }

        _.name = '';
        _.expression = null;
    }
);


PropToken.definePrototype({
    enumerable: true
}, {
    type: 'prop'
});

PropToken.definePrototype({
    TYPE_ID: Token.tokens.push(PropToken) - 1,
    toArray: function () {
        var _ = this;
        return [
            _.TYPE_ID,
            _.name,
            _.expression
        ];
    },

    toObject: function () {
        var _ = this;
        return {
            type: _.type,
            TYPE_ID: _.TYPE_ID,
            name: _.name,
            expression: _.expression
        };
    },

    _fromArray: function _fromArray(arr) {
        var _ = this;

        _.name = arr[1];

        var expression = new Token.tokens[arr[2][0]]();

        expression.fromArray(arr[2]);

        _.expression = expression;
    },

    toString: function toString() {
        var _ = this,
            str = _.name + ':{{ ';
        str += _.expression.toString();
        str += ' }}';
        return str;
    }
});

Token.tokens.prop = PropToken;

},{"./token":17}],15:[function(require,module,exports){
var Token = require('./token');

var TagToken = Token.generate(
    function TagToken(code) {
        var _ = this;

        if (code) {
            Token.call(_, code);
        }

        _.name = '';

        _.attrs = [];
        _.props = [];
        _.nodes = [];

        _.attrsUpdate = 0;
        _.nodesUpdate = 0;
    }
);


TagToken.definePrototype({
    enumerable: true
}, {
    type: 'tag'
});

TagToken.definePrototype({
    TYPE_ID: Token.tokens.push(TagToken) - 1,
    toArray: function () {
        var _ = this;
        return [
            _.TYPE_ID,
            _.name,
            _.attrs,
            _.attrsUpdate,
            _.nodes,
            _.nodesUpdate,
            _.props
        ];
    },

    toObject: function () {
        var _ = this;
        return {
            type: _.type,
            TYPE_ID: _.TYPE_ID,
            name: _.name,
            attrs: _.attrs,
            attrsUpdate: _.attrsUpdate,
            nodes: _.nodes,
            nodesUpdate: _.nodesUpdate,
            props: _.props
        };
    },

    _fromArray: function _fromArray(arr) {
        var _ = this;

        _.name = arr[1];

        _.attrs = arr[2].map(function (item) {
            var attr = new Token.tokens[item[0]]();

            attr.fromArray(item);

            return attr;
        });

        _.attrsUpdate = arr[3];

        _.nodes = arr[4].map(function (item) {
            var node = new Token.tokens[item[0]]();

            node.fromArray(item);

            return node;
        });

        _.nodesUpdate = arr[5];

        _.props = arr[6].map(function (item) {
            var prop = new Token.tokens[item[0]]();

            prop.fromArray(item);

            return prop;
        });
    },

    toString: function toString() {
        var _ = this,
            str = _.indentLevel + '<' + _.name;

        for (var i = 0; i < _.attrs.length; i++) {
            str += _.attrs[i].toString();
        }

        if (_.selfClosed) {
            str += (_.attrs.length ? ' ' : '') + '/>'; 
            return str;
        }

        str += '>'; 
        if (_.selfClosing) {
            return str;
        }
        var nodes = '';
        for (i = 0; i < _.nodes.length; i++) {
            _.nodes[i].indentLevel = (_.indentLevel ? _.indentLevel +
                '  ' : '');
            nodes += _.nodes[i].toString();
        }

        str += nodes.trim();

        str += _.indentLevel + '</' + _.name + '>';

        return str;
    },

    updates: function updates(type) {
        var _ = this;

        if (type === 'attr') {
            _.attrsUpdate = 1;
        } else {
            _.nodesUpdate = 1;
        }
    }
});

Token.tokens.tag = TagToken;

},{"./token":17}],16:[function(require,module,exports){
var Token = require('./token');

var TextToken = Token.generate(
    function TextToken(code) {
        var _ = this;

        if (code) {
            Token.call(_, code);
        }

        _.value = '';
    }
);


TextToken.definePrototype({
    enumerable: true
}, {
    type: 'text'
});

TextToken.definePrototype({
    TYPE_ID: Token.tokens.push(TextToken) - 1,
    toArray: function () {
        var _ = this;
        return [
            _.TYPE_ID,
            _.value
        ];
    },

    toObject: function () {
        var _ = this;
        return {
            type: _.type,
            TYPE_ID: _.TYPE_ID,
            value: _.value
        };
    },

    _fromArray: function _fromArray(arr) {
        var _ = this;

        _.value = arr[1];
    },

    toString: function toString() {
        var _ = this,
            str = '';

        str += _.indentLevel + _.value;

        return str;
    }
});

Token.tokens.text = TextToken;

},{"./token":17}],17:[function(require,module,exports){
var Token = require('compileit')
    .Token;

var BarsToken = Token.generate(
    function BarsToken(code, type) {
        Token.call(this, code, type);
    }
);

BarsToken.tokens = [];

BarsToken.definePrototype({
    writable: true
}, {
    indentLevel: '',
    JSONuseObject: true
});

BarsToken.definePrototype({
    TYPE_ID: -1,

    toJSON: function toJSON(arr) {
        if (this.JSONuseObject)
            return this.toObject();
        return this.toArray();
    },

    toArray: function toArray() {
        var _ = this;

        console.warn('toArray not impleneted.');
        return [-1];
    },

    toObject: function toObject() {
        var _ = this;

        console.warn('toObject not impleneted.');
        return {
            type: _.type,
            TYPE_ID: _.TYPE_ID
        };
    },
    fromArray: function fromArray(arr) {
        var _ = this;
        if (arr[0] !== _.TYPE_ID) {
            throw 'TypeMismatch: ' + arr[0] + ' is not ' + _.TYPE_ID;
        }

        _._fromArray(arr);
    },
    updates: function updates() {
        var _ = this;
        console.warn('updates not impleneted.');
    }
});

module.exports = BarsToken;

},{"compileit":36}],18:[function(require,module,exports){
var Token = require('./token');

var TransformToken = Token.generate(
    function TransformToken(code) {
        var _ = this;

        if (code) {
            Token.call(_, code);
        }

        _.name = '';

        _.arguments = [];
    }
);


TransformToken.definePrototype({
    enumerable: true
}, {
    type: 'transform'
});

TransformToken.definePrototype({
    TYPE_ID: Token.tokens.push(TransformToken) - 1,
    toArray: function () {
        var _ = this;
        return [
            _.TYPE_ID,
            _.name,
            _.arguments
        ];
    },

    toObject: function () {
        var _ = this;
        return {
            type: _.type,
            TYPE_ID: _.TYPE_ID,
            name: _.name,
            arguments: _.arguments
        };
    },

    _fromArray: function _fromArray(arr) {
        var _ = this;

        _.name = arr[1];

        _.arguments = arr[2].map(function (item) {
            var arg = new Token.tokens[item[0]]();

            arg.fromArray(item);

            return arg;
        });
    },

    toString: function toString() {
        var _ = this,
            str = '@';

        str += _.name + '(';

        for (var i = 0; i < _.arguments.length; i++) {

            str += _.arguments[i].toString() + (i + 1 < _.arguments
                .length ?
                ', ' : '');
        }

        str += ')';

        return str;
    }
});

Token.tokens.transform = TransformToken;

},{"./token":17}],19:[function(require,module,exports){
var Token = require('./token');

var ValueToken = Token.generate(
    function ValueToken(code) {
        var _ = this;

        if (code) {
            Token.call(_, code);
        }

        _.path = '';
    }
);


ValueToken.definePrototype({
    enumerable: true
}, {
    type: 'value'
});

ValueToken.definePrototype({
    TYPE_ID: Token.tokens.push(ValueToken) - 1,
    toArray: function () {
        var _ = this;
        return [
            _.TYPE_ID,
            _.path
        ];
    },

    toObject: function () {
        var _ = this;
        return {
            type: _.type,
            TYPE_ID: _.TYPE_ID,
            path: _.path
        };
    },

    _fromArray: function _fromArray(arr) {
        var _ = this;

        _.path = arr[1];
    },

    toString: function toString() {
        var _ = this,
            str = '';

        if (
            _.path[0] === '~' ||
            _.path[0] === '..' ||
            _.path[0] === '.' ||
            _.path[0] === '@'
        ) {
            str += _.path.join('/');
        } else {
            str += _.path.join('.');
        }

        return str;
    }
});

Token.tokens.value = ValueToken;

},{"./token":17}],20:[function(require,module,exports){
var BarsNode = require('./bars-node'),
    NODES = require('./nodes'),
    ac = require('../text-renderer')
    .ac;

/**
 * [AttrNode description]
 * @param {[type]} bars    [description]
 * @param {[type]} struct  [description]
 */
AttrNode = BarsNode.generate(
    function AttrNode(bars, struct) {
        BarsNode.call(this);
        var _ = this;

        _.bars = bars;
        _.name = struct.name;
        _.nodes = struct.nodes;
    }
);

AttrNode.definePrototype({
    isDOM: true,
    update: function update(context) {
        var _ = this;

        _.val = ac(_.nodes, _.bars, context)
            .slice(2, -1);

        _._elementAppendTo();
    },
    _elementAppendTo: function _elementAppendTo(parent) {
        var _ = this;

        parent = parent || _.getParent();

        parent = parent && parent.$el;

        if (parent instanceof Element) {
            parent.setAttribute(_.name, _.val);
        }
    },
    _elementRemove: function _elementRemove() {
        var _ = this,
            parent = _.parent.$el;

        if (parent instanceof Element) {
            parent.removeAttribute(_.name);
        }
    }
});

NODES.attr = AttrNode;

},{"../text-renderer":29,"./bars-node":21,"./nodes":25}],21:[function(require,module,exports){
var Generator = require('generate-js');

function insertAfter(newNode, referenceNode) {
    referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
}

var BarsNode = Generator.generate(
    function BarsNode() {}
);

BarsNode.definePrototype({
    update: function update(context) {
        var _ = this;

        var $parent = _.getParent();

        _.prevDOM = $parent && $parent.lastUpdated;

        _._update(context);

        _._elementAppendTo();

        if (_.isDOM && $parent) $parent.lastUpdated = _;
    },

    _update: function _update() {
        console.warn('_update method not implemented.');
    },

    appendChild: function appendChild(child) {
        var _ = this;

        _.nodes.push(child);
        child.parent = _;
    },

    appendTo: function appendTo(parent) {
        var _ = this;

        if (parent instanceof Element) {
            _._elementAppendTo(parent);
        }

        if (BarsNode.isCreation(parent)) {
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

    _elementAppendTo: function _elementAppendTo(parent) {
        var _ = this;
        parent = parent || _.getParent();

        parent = parent && parent.$el;

        if (_.prevDOM && _.prevDOM.$el && _.prevDOM.$el.nextSibling !== _.$el) {
            insertAfter(_.$el, _.prevDOM.$el);
        } else if (parent && parent !== _.$el.parentNode) {
            parent.appendChild(_.$el);
        }

    },

    _elementRemove: function _elementRemove() {
        var _ = this;

        if (_.isDOM && _.$el.parentNode instanceof Element) {
            _.$el.parentNode.removeChild(_.$el);
        }
    },

    getParent: function getParent() {
        var _ = this,
            parent = _;

        do {
            parent = parent.parent;
        } while (parent && !parent.isDOM);

        return parent;
    }
});


module.exports = BarsNode;

},{"generate-js":42}],22:[function(require,module,exports){
var BarsNode = require('./bars-node');
var NODES = require('./nodes');
var execute = require('../../runtime/execute');

function makeVars(context, map, bars) {
    var vars = {};
    for (var i = 0; i < map.length; i++) {
        vars[map[i].name] = execute(map[i].expression, bars.transforms, context);
    }
    // console.log(vars);
    return vars;
}

BlockNode = BarsNode.generate(
    function BlockNode(bars, struct) {
        BarsNode.call(this);

        var _ = this;
        var nodes = struct.nodes || [];

        _.bars = bars;

        _.name = struct.name;
        _.arguments = struct.arguments;
        _.map = struct.map;
        _.consequent = struct.consequent;
        _.alternate = struct.alternate;

        _.consMap = new Map();
        _.altsMap = new Map();

        _.nodes = [];

        for (i = 0; i < nodes.length; i++) {
            var node = nodes[i];
            _.appendChild(new NODES[node.type](bars, node));
        }
    }
);

BlockNode.definePrototype({
    _update: function _update(context) {
        var _ = this,
            i;

        var cons = [];

        function consequent(new_context) {
            new_context = new_context || context;
            new_context = new_context.contextWithVars(
                makeVars(new_context, _.map, _.bars)
            );
            cons.push(new_context);
        }

        var alts = [];

        function alternate(new_context) {
            if (new_context) {
                new_context = new_context.contextWithVars(
                    makeVars(new_context, _.map, _.bars)
                );
            }
            alts.push(new_context || context);
        }

        var blockFunc = _.bars.blocks[_.name];

        if (typeof blockFunc !== 'function') {
            throw 'Missing Block helper: ' + _.name;
        }

        blockFunc(
            _.arguments.map(function (expression) {
                return execute(expression, _.bars.transforms, context);
            }),
            consequent,
            alternate,
            context
        );

        var newNodes = [];

        if (cons.length) {
            for (i = 0; i < cons.length; i++) {
                newNodes.push(
                    _.consMap.get(cons[i].data) ||
                    new NODES[_.consequent.type](_.bars, _.consequent)
                );
            }
            _.consMap.clear();

            for (i = 0; i < cons.length; i++) {
                _.consMap.set(cons[i].data, newNodes[i]);
            }

            for (i = 0; i < _.nodes.length; i++) {
                if (newNodes.indexOf(_.nodes[i]) === -1) {
                    _.nodes[i].remove();
                }
            }

            _.nodes = [];

            for (i = 0; i < newNodes.length; i++) {
                _.appendChild(newNodes[i]);
            }

            for (i = 0; i < _.nodes.length; i++) {
                _.nodes[i].update(cons[i]);
            }
        } else {
            for (i = 0; i < alts.length; i++) {
                newNodes.push(
                    _.altsMap.get(alts[i]) ||
                    new NODES[_.alternate.type](_.bars, _.alternate)
                );
            }
            _.altsMap.clear();

            for (i = 0; i < alts.length; i++) {
                _.altsMap.set(alts[i], newNodes[i]);
            }

            for (i = 0; i < _.nodes.length; i++) {
                if (newNodes.indexOf(_.nodes[i]) === -1) {
                    _.nodes[i].remove();
                }
            }

            _.nodes = [];

            for (i = 0; i < newNodes.length; i++) {
                _.appendChild(newNodes[i]);
            }

            for (i = 0; i < _.nodes.length; i++) {
                _.nodes[i].update(cons[i]);
            }
        }
    },
    _elementAppendTo: function _elementAppendTo(parent) {
        var _ = this;
        parent = parent || _.getParent();

        for (var i = 0; i < _.nodes.length; i++) {
            _.nodes[i]._elementAppendTo(parent);
        }
    },

    _elementRemove: function _elementRemove() {
        var _ = this;

        for (var i = 0; i < _.nodes.length; i++) {
            _.nodes[i]._elementRemove();
        }
    }
});

NODES.block = BlockNode;

},{"../../runtime/execute":32,"./bars-node":21,"./nodes":25}],23:[function(require,module,exports){
var BarsNode = require('./bars-node');
var NODES = require('./nodes');
var execute = require('../../runtime/execute');

Fragment = BarsNode.generate(
    function Fragment(bars, struct) {
        BarsNode.call(this);

        var _ = this;
        var nodes = struct.nodes || [];

        // _.$el = document.createDocumentFragment();
        _.nodes = [];

        for (i = 0; i < nodes.length; i++) {
            var node = nodes[i];
            _.appendChild(new NODES[node.type](bars, node));
        }
    }
);

Fragment.definePrototype({
    _update: function _update(context) {
        var _ = this,
            i;

        for (i = 0; i < _.nodes.length; i++) {
            _.nodes[i].update(context);
        }
    },

    _elementAppendTo: function _elementAppendTo(parent) {
        var _ = this;
        parent = parent || _.getParent();

        for (var i = 0; i < _.nodes.length; i++) {
            _.nodes[i]._elementAppendTo(parent);
        }
    },

    _elementRemove: function _elementRemove() {
        var _ = this;

        for (var i = 0; i < _.nodes.length; i++) {
            _.nodes[i]._elementRemove();
        }
    }
});

NODES.fragment = Fragment;

},{"../../runtime/execute":32,"./bars-node":21,"./nodes":25}],24:[function(require,module,exports){
var NODES = require('./nodes');

require('./block-node');
require('./partial-node');
require('./fragment-node');
require('./tag-node');
require('./attr-node');
require('./text-node');

module.exports = NODES;

},{"./attr-node":20,"./block-node":22,"./fragment-node":23,"./nodes":25,"./partial-node":26,"./tag-node":27,"./text-node":28}],25:[function(require,module,exports){
var NODES = {};

module.exports = NODES;

},{}],26:[function(require,module,exports){
var BarsNode = require('./bars-node');
var NODES = require('./nodes');
var execute = require('../../runtime/execute');

function makeVars(context, map, bars) {
    var vars = {};
    for (var i = 0; i < map.length; i++) {
        vars[map[i].name] = execute(map[i].expression, bars.transforms, context);
    }

    return vars;
}

PartialNode = BarsNode.generate(
    function PartialNode(bars, struct) {
        BarsNode.call(this);

        var _ = this;
        var nodes = struct.nodes || [];

        _.bars = bars;

        _.name = struct.name;
        _.expression = struct.expression;
        _.map = struct.map;

        _.nodes = [];

        _.fragMap = new Map();
    }
);

PartialNode.definePrototype({
    _update: function _update(context) {
        var _ = this,
            i, name = _.name;

        if (typeof _.name === 'object') {
            name = execute(_.name, _.bars.transforms, context);
        }

        var frag = _.fragMap.get(name);

        if (!frag) {
            var partial = _.bars.partials[name];

            if (!partial) {
                throw 'error';
            }

            frag = new NODES.fragment(_.bars, partial.fragment);

            _.fragMap.set(name, frag);
        }

        if (_.expression) {
            context = context.newContext(
                execute(_.expression, _.bars.transforms, context),
                null,
                true
            );
        }

        context = context.contextWithVars(makeVars(context, _.map, _.bars));

        if (_.nodes[0] !== frag) {
            if (_.nodes[0]) {
                _.nodes[0].remove();
            }

            _.nodes = [];

            _.appendChild(frag);
        }

        frag.update(context);
    },
    _elementAppendTo: function _elementAppendTo(parent) {
        var _ = this;
        parent = parent || _.getParent();

        for (var i = 0; i < _.nodes.length; i++) {
            _.nodes[i]._elementAppendTo(parent);
        }
    },

    _elementRemove: function _elementRemove() {
        var _ = this;

        for (var i = 0; i < _.nodes.length; i++) {
            _.nodes[i]._elementRemove();
        }
    }
});

NODES.partial = PartialNode;

},{"../../runtime/execute":32,"./bars-node":21,"./nodes":25}],27:[function(require,module,exports){
var BarsNode = require('./bars-node');
var NODES = require('./nodes');
var execute = require('../../runtime/execute');

TagNode = BarsNode.generate(
    function TagNode(bars, struct) {
        BarsNode.call(this);

        var _ = this,
            nodes = struct.nodes || [],
            attrs = struct.attrs || [],
            i;

        _.bars = bars;

        _.$el = document.createElement(struct.name);
        _.attrs = [];
        _.nodes = [];
        _.props = struct.props || [];

        for (i = 0; i < nodes.length; i++) {
            var node = nodes[i];
            _.appendChild(new NODES[node.type](bars, node));
        }

        for (i = 0; i < attrs.length; i++) {
            var attr = attrs[i];
            _.addAttr(new NODES[attr.type](bars, attr));
        }
    }
);

TagNode.definePrototype({
    isDOM: true,
    _update: function _update(context) {
        var _ = this,
            i,
            _data = {};

        for (i = 0; i < _.props.length; i++) {
            _data[_.props[i].name] = execute(
                _.props[i].expression,
                _.bars.transforms,
                context
            );
        }

        _.$el.data = function data(key) {
            return _data[key];
        };

        for (i = 0; i < _.attrs.length; i++) {
            _.attrs[i].update(context);
        }

        _.lastUpdated = null;

        for (i = 0; i < _.nodes.length; i++) {
            _.nodes[i].update(context);
        }

        _.lastUpdated = null;
    },

    addAttr: function addAttr(child) {
        var _ = this;

        _.attrs.push(child);
        child.parent = _;
    }
});

NODES.tag = TagNode;

},{"../../runtime/execute":32,"./bars-node":21,"./nodes":25}],28:[function(require,module,exports){
var BarsNode = require('./bars-node');
var NODES = require('./nodes');
var execute = require('../../runtime/execute');

/**
 * [TextNode description]
 * @param {[type]} bars    [description]
 * @param {[type]} struct  [description]
 */
TextNode = BarsNode.generate(
    function TextNode(bars, struct) {
        BarsNode.call(this);
        var _ = this;

        _.$el = document.createTextNode(struct.value);

        _.bars = bars;

        _.expression = struct.expression;
    }
);

TextNode.definePrototype({
    isDOM: true,
    appendChild: function appendChild(child) {
        console.warn('appendChild CANNOT be called on TextNodes.');
    },

    _update: function _update(context) {
        var _ = this;

        if (_.expression) {
            _.$el.textContent = execute(_.expression, _.bars.transforms, context);
        }
    },
});

NODES.text = TextNode;
NODES.insert = TextNode;

},{"../../runtime/execute":32,"./bars-node":21,"./nodes":25}],29:[function(require,module,exports){
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

function abb(token, bars, context) {
    var r = '';

    function consequent(new_context) {
        new_context = new_context || context;
        new_context = new_context.contextWithVars(makeVars(new_context, token.map, bars));
        r += ac(token.consequent.nodes, bars, new_context);
    }

    function alternate(new_context) {
        if (new_context) {
            new_context = new_context.contextWithVars(makeVars(new_context, token.map, bars));
        }
        r += ac(token.alternate.nodes, bars, new_context || context);
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

function ac(tokens, bars, context) {
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
            r += abb(token, bars, context);
        }
    }

    r += '"';

    return r;
}

function a(token, bars, context) {
    var r = ' ';
    r += token.name;
    r += ac(token.nodes, bars, context);

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
        r += a(token.attrs[i], bars, context);
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

render.ac = ac;

module.exports = render;

},{"../runtime/execute":32}],30:[function(require,module,exports){
var Generator = require('generate-js');
var ContextN = require('./runtime/context-n');
// var renderV = require('./render/render');
var renderT = require('./render/text-renderer');
var NODES = require('./render/dom-renderer');

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
    // _.tree = renderV(_.bars, _.struct, new ContextN(state));
    // _.rootNode = createElement(_.tree);

    _.struct.fragment.name = 'div';

    _.dom = new NODES.tag(_.bars, _.struct.fragment);

    _.rootNode = _.dom.$el;

    if (state) {
        _.update(state);
    }
});

Renderer.definePrototype({
    // update: function update(state) {
    //     var _ = this;
    //
    //     var newTree = renderV(_.bars, _.struct, new ContextN(state));
    //     var patches = diff(_.tree, newTree);
    //     patch(_.rootNode, patches);
    //     _.tree = newTree;
    // },

    update: function update(state) {
        var _ = this;

        _.dom.update(new ContextN(state));
    },
    text: function text(state, options) {
        var _ = this;

        options = options || {};

        var indent = repeat(options.tabs ? '\t' : ' ', options.tabs ? 1 : options.indent);

        return renderT(_.struct.fragment, indent, _.bars, new ContextN(state));
    },
    appendTo: function appendTo(el) {
        var _ = this;

        el.appendChild(_.rootNode);
    }
});

module.exports = Renderer;

},{"./render/dom-renderer":24,"./render/text-renderer":29,"./runtime/context-n":31,"generate-js":42,"virtual-dom/create-element":45,"virtual-dom/diff":46,"virtual-dom/patch":47}],31:[function(require,module,exports){
var Generator = require('generate-js');

var Context = Generator.generate(function Context(data, props, context, cleanVars) {
    var _ = this;

    _.data = data;
    _.props = props;
    _.context = context;

    if (cleanVars || !context) {
        _.vars = Object.create(null);
    } else {
        _.vars = Object.create(context.vars);
    }

});

Context.definePrototype({
    lookup: function lookup(path) {
        var _ = this,
            i = 0;

        if (path[0] === '@') {
            // console.log(_.props[path[1]]);
            return _.props[path[1]];
        }

        if (
            path[0] === 'this'
        ) {
            return _.data;
        }

        if (path[0] in _.vars) {
            return _.vars[path[0]];
        }

        return _.data[path[0]];
    },
    newContext: function newContext(data, props, cleanVars) {
        return new Context(data, props, this, cleanVars);
    },
    contextWithVars: function contextWithVars(vars) {
        var _ = this;

        var context = new Context(_.data, _.props, _);

        context.setVars(vars);

        return context;
    },
    setVars: function setVars(vars) {
        var _ = this;

        for (var v in vars) {
            if (vars.hasOwnProperty(v)) {
                _.vars[v] = vars[v];
            }
        }
    }
});

module.exports = Context;

},{"generate-js":42}],32:[function(require,module,exports){
var logic = require('./logic');

function execute(syntaxTree, transforms, context) {
    function run(token) {
        var result,
            args = [];
        // console.log('>>>>', token)
        if (
            token.type === 'literal'
        ) {
            result = token.value;
        } else if (
            token.type === 'value'
        ) {
            result = context.lookup(token.path);
        } else if (
            token.type === 'operator' &&
            token.operands.length === 1
        ) {
            result = logic[token.operator](
                run(token.operands[0])
            );
        } else if (
            token.type === 'operator' &&
            token.operands.length === 2
        ) {
            if (token.operator === '||') {
                result = run(token.operands[0]) || run(token.operands[1]);
            } else if (token.operator === '&&') {
                result = run(token.operands[0]) && run(token.operands[1]);
            } else {
                result = logic[token.operator](
                    run(token.operands[0]),
                    run(token.operands[1])
                );
            }
        } else if (
            token.type === 'transform'
        ) {
            for (var i = 0; i < token.arguments.length; i++) {
                args.push(run(token.arguments[i]));
            }
            if (transforms[token.name] instanceof Function) {
                result = transforms[token.name].apply(null, args);
            } else {
                throw 'Missing Transfrom: "' + token.name + '".';
            }
        }
        // console.log('<<<<', result)
        return result;
    }

    if (syntaxTree) {
        return run(syntaxTree);
    } else {
        return context.lookup('.');
    }
}

module.exports = execute;

},{"./logic":33}],33:[function(require,module,exports){
/*Look up*/
exports.lookup = function add(a, b) {
    // return a ? a[b] : void(0); // soft
    return a[b]; // hard
};
exports['.'] = exports.lookup;

/* Arithmetic */
exports.add = function add(a, b) {
    return a + b;
};
exports.subtract = function subtract(a, b) {
    return a - b;
};
exports.multiply = function multiply(a, b) {
    return a * b;
};
exports.devide = function devide(a, b) {
    return a / b;
};
exports.mod = function mod(a, b) {
    return a % b;
};

exports['+'] = exports.add;
exports['-'] = exports.subtract;
exports['*'] = exports.multiply;
exports['/'] = exports.devide;
exports['%'] = exports.mod;

/* Logic */

exports.not = function not(a) {
    return !a;
};

exports['!'] = exports.not;

exports.or = function or(a, b) {
    return a || b;
};
exports.and = function and(a, b) {
    return a && b;
};

exports['||'] = exports.or;
exports['&&'] = exports.and;

/* Comparison */

exports.strictequals = function strictequals(a, b) {
    return a === b;
};
exports.strictnotequals = function strictnotequals(a, b) {
    return a !== b;
};

exports['==='] = exports.strictequals;
exports['!=='] = exports.strictnotequals;

exports.equals = function equals(a, b) {
    return a == b;
};
exports.notequals = function notequals(a, b) {
    return a != b;
};
exports.ltequals = function ltequals(a, b) {
    return a <= b;
};
exports.gtequals = function gtequals(a, b) {
    return a >= b;
};

exports['=='] = exports.equals;
exports['!='] = exports.notequals;
exports['<='] = exports.ltequals;
exports['>='] = exports.gtequals;

exports.lt = function lt(a, b) {
    return a < b;
};
exports.gt = function gt(a, b) {
    return a > b;
};

exports['<'] = exports.lt;
exports['>'] = exports.gt;

},{}],34:[function(require,module,exports){
var Generator = require('generate-js');

var Transform = Generator.generate(function Transform() {});

Transform.definePrototype({
    log: function log() {
        var args = Array.prototype.slice.call(arguments);
        args.unshift('Bars:');
        console.log.apply(console, args);
    },
    upperCase: function upperCase(a) {
        return String(a)
            .toUpperCase();
    },
    lowerCase: function lowerCase(a) {
        return String(a)
            .toLowerCase();
    },
    number: function number(a) {
        return Number(a);
    },
    string: function string(a) {
        return String(a);
    },
    reverse: function reverse(arr) {
        return arr.slice()
            .reverse();
    },
    slice: function (arr, start, end) {
        return arr.slice(start, end);
    },
    map: function map(arr, prop) {
        return arr.map(function (item) {
            return arr[prop];
        });
    },
    sort: function sort(arr, key) {
        return arr.slice()
            .sort(function (a, b) {
                if (key) {
                    if (a[key] < b[key]) return -1;
                    if (a[key] > b[key]) return 1;
                    return 0;
                }

                if (a < b) return -1;
                if (a > b) return 1;
                return 0;
            });
    },
    sum: function sum(arr, key) {
        var sum = 0,
            i;
        if (key) {
            for (i = 0; i < arr.length; i++) {
                sum += arr[i][key];
            }
        } else {
            for (i = 0; i < arr.length; i++) {
                sum += arr[i];
            }
        }

        return sum;
    },
    ave: function ave(arr, key) {
        var sum = 0,
            i;
        if (key) {
            for (i = 0; i < arr.length; i++) {
                sum += arr[i][key];
            }
        } else {
            for (i = 0; i < arr.length; i++) {
                sum += arr[i];
            }
        }

        return sum / arr.length;
    }
});

module.exports = Transform;

},{"generate-js":42}],35:[function(require,module,exports){

},{}],36:[function(require,module,exports){
exports.Compiler = require('./lib/compiler');
exports.Token = require('./lib/token');

},{"./lib/compiler":38,"./lib/token":40}],37:[function(require,module,exports){
var Generator = require('generate-js'),
    utils = require('./utils');

var CodeBuffer = Generator.generate(
    function CodeBuffer(str, file) {
        var _ = this;

        _.reset();
        _._buffer = str;
        _._file = file;
    }
);

CodeBuffer.definePrototype({
    reset: function reset() {
        var _ = this;

        _.line = 1;
        _.column = 1;
        _._index = 0;
        _._currentLine = 0;
    },
    currentLine: {
        get: function currentLine() {
            var _ = this,
                lineText = '',
                i = _._currentLine;

            while (i < _.length) {
                lineText += _._buffer[i];
                if (_._buffer.codePointAt(i) === 10) {
                    break;
                }
                i++;
            }

            return lineText;
        }
    },

    buffer: {
        get: function getBuffer() {
            var _ = this;

            return _._buffer;
        }
    },


    index: {
        get: function getIndex() {
            var _ = this;

            return _._index;
        },

        set: function setIndex(val) {
            var _ = this,
                i = _._index,
                update = false;

            val = Math.min(_.length, val);
            val = Math.max(0, val);

            if (i == val) return;

            if (i > val) {
                // throw new Error('========' + val + ' < ' +i+'=======');
                _.reset();
                i = _._index;
            }

            if (_.buffer.codePointAt(i) === 10) {
                update = true;
                i++;
            }

            for (; i <= val; i++) {
                if (update) {
                    _._currentLine = i;
                    _.line++;
                    update = false;
                } else {
                    _.column++;
                }

                if (_.buffer.codePointAt(i) === 10) {
                    update = true;
                }
            }
            _.column = val - _._currentLine + 1;
            _._index = val;
        }
    },

    length: {
        get: function getLength() {
            var _ = this;

            return _._buffer.length;
        }
    },

    next: function next() {
        var _ = this;

        _.index++;
        return _.charAt(_.index);
    },

    left: {
        get: function getLeft() {
            var _ = this;

            return _._index < _.length;
        }
    },

    charAt: function charAt(i) {
        var _ = this;

        return _._buffer[i] || 'EOF';
    },

    codePointAt: function codePointAt(i) {
        var _ = this;

        return _._buffer.codePointAt(i);
    },

    slice: function slice(startIndex, endIndex) {
        var _ = this;

        return _._buffer.slice(startIndex, endIndex);
    },

    makeError: function makeError(start, end, message) {
        var _ = this;

        utils.assertTypeError(start, 'number');
        utils.assertTypeError(end, 'number');
        utils.assertTypeError(message, 'string');

        _.index = start;

        var currentLine = _.currentLine,
            tokenLength = end - start,
            tokenIdentifier =
            currentLine[currentLine.length - 1] === '\n' ? '' :
            '\n',
            i;

        for (i = 1; i < _.column; i++) {
            tokenIdentifier += ' ';
        }

        tokenLength = Math.min(
            tokenLength,
            currentLine.length - tokenIdentifier.length
        ) || 1;

        for (i = 0; i < tokenLength; i++) {
            tokenIdentifier += '^';
        }

        return 'Syntax Error: ' +
            message +
            ' at ' +
            (_._file ? _._file + ':' : '') +
            _.line +
            ':' +
            _.column +
            '\n\n' +
            currentLine +
            tokenIdentifier +
            '\n';
    }
});

module.exports = CodeBuffer;

},{"./utils":41,"generate-js":42}],38:[function(require,module,exports){
var Generator = require('generate-js'),
    Scope = require('./scope'),
    Token = require('./token'),
    CodeBuffer = require('./code-buffer'),
    utils = require('./utils');

var Compiler = Generator.generate(
    function Compiler(parseModes, formaters) {
        var _ = this;

        _.modeFormater = formaters.modeFormater || utils.varThrough;
        _.charFormater = formaters.charFormater || utils.varThrough;
        _.funcFormater = formaters.funcFormater || utils.varThrough;
        _.typeFormater = formaters.typeFormater || utils.varThrough;
        _.sourceFormater = formaters.sourceFormater || utils.varThrough;

        _.parseModes = parseModes;
        _.scope = new Scope();
    }
);

Compiler.definePrototype({
    compile: function compile(codeStr, file, mode, flags) {
        var _ = this,
            tokens = [];

        _.codeBuffer = new CodeBuffer(codeStr, file);

        _.scope.verbose = flags.verbose;

        if (flags.verbose) {
            _.scope.printScope();
        }

        _.parseMode(mode, tokens, flags);

        if (flags.verbose) {
            _.scope.printScope();
        }

        if (_.scope.length) {
            throw _.codeBuffer.makeError(
                'Unexpected End Of Input.'
            );
        }

        return tokens;
    },

    parseMode: function parseMode(mode, tokens, flags) {
        var _ = this,
            scope = _.scope,
            code = _.codeBuffer,
            token,
            parseFuncs = _.parseModes[mode],
            index = code.index;

        if (!parseFuncs) {
            throw new Error('Mode not found: ' + JSON.stringify(
                mode) + '.');
        }

        function newParseMode(mode, tokens, flags) {
            _.parseMode(mode, tokens, flags);
        }

        newParseMode.close = function () {
            this.closed = true;
        };

        loop: while (code.left) {

            for (var i = 0; i < parseFuncs.length; i++) {
                var parseFunc = parseFuncs[i];

                if (flags.verbose) {
                    console.log(
                        utils.repeat('  ', scope.length +
                            1) +
                        _.modeFormater(mode) + ' ' +
                        _.funcFormater(parseFunc.name) +
                        '\n' +
                        utils.repeat('  ', scope.length +
                            1) +
                        utils.bufferSlice(code, 5, _.charFormater)
                    );
                }

                token = parseFunc(
                    mode,
                    code,
                    tokens,
                    flags,
                    scope,
                    newParseMode
                );

                if (token) {
                    if (token instanceof Token) {
                        tokens.push(token);

                        if (flags.verbose) {
                            console.log(
                                utils.repeat('  ', scope.length +
                                    1) +
                                _.typeFormater(token.constructor
                                    .name || token.type) +
                                ': ' +
                                _.sourceFormater(token.source())
                            );
                        }
                    }

                    if (newParseMode.closed) {
                        delete newParseMode.closed;
                        break loop;
                    }

                    break;
                }
            }

            if (newParseMode.closed) {
                delete newParseMode.closed;
                break loop;
            }

            if (index === code.index) {
                token = new Token(code);
                token.close(code);
                token.value = token.source(code);

                if (flags.noErrorOnILLEGAL) {
                    tokens.push(token);
                } else {
                    throw code.makeError(
                        token.range[0],
                        token.range[1],
                        'ILLEGAL Token: ' +
                        JSON.stringify(
                            token.source(code)
                        )
                        .slice(1, -1)
                    );
                }
            }

            index = code.index;
        }
    }
});

module.exports = Compiler;

},{"./code-buffer":37,"./scope":39,"./token":40,"./utils":41,"generate-js":42}],39:[function(require,module,exports){
var Generator = require('generate-js'),
    Token = require('./token'),
    utils = require('./utils');

var Scope = Generator.generate(
    function Scope() {
        var _ = this;

        _.defineProperties({
            _scope: []
        });
    }
);

Scope.definePrototype({
    push: function push(token) {
        var _ = this;

        utils.assertError(Token.isCreation(token), 'Invalid Type.');

        _._scope.push(token);

        if (_.verbose) {
            _.printScope();
        }

        return _._scope.length;
    },
    pop: function pop() {
        var _ = this;

        var token = _._scope.pop();

        if (_.verbose) {
            _.printScope();
        }

        return token;
    },
    close: function close() {
        var _ = this;

        var token = _._scope.pop();

        token.close();

        if (_.verbose) {
            _.printScope();
        }

        return token;
    },
    printScope: function printScope() {
        var _ = this;

        console.log(
            ['Main'].concat(
                _._scope
                .map(function (item) {
                    return item.constructor.name ||
                        item.type;
                })
            )
            .join(' => ')
        );
    },
    token: {
        get: function getToken() {
            var _ = this;

            return _._scope[_._scope.length - 1];
        }
    },
    length: {
        get: function getLength() {
            var _ = this;

            return _._scope.length;
        }
    }
});

module.exports = Scope;

},{"./token":40,"./utils":41,"generate-js":42}],40:[function(require,module,exports){
var Generator = require('generate-js'),
    utils = require('./utils');

var Token = Generator.generate(
    function Token(code, type) {
        var _ = this;

        _.defineProperties({
            code: code
        });

        _.type = type;
        _.range = [code.index, code.index + 1];
        _.loc = {
            start: {
                line: code.line,
                column: code.column
            },
            end: {
                line: code.line,
                column: code.column + 1
            }
        };
    }
);

Token.definePrototype({
    writable: true,
    enumerable: true
}, {
    type: 'ILLEGAL'
});

Token.definePrototype({
    length: {
        get: function getLength() {
            return this.range[1] - this.range[0];
        }
    },
    source: function source() {
        var _ = this;
        return _.code.slice(_.range[0], _.range[1]);
    },
    close: function close() {
        var _ = this;

        if (_.closed) {
            throw new Error('Cannot call close on a closed token.');
        }

        _.closed = true;

        if (_.code.index > _.range[1]) {
            _.range[1] = _.code.index;
            _.loc.end = {
                line: _.code.line,
                column: _.code.column
            };
        }
    }
});

module.exports = Token;

},{"./utils":41,"generate-js":42}],41:[function(require,module,exports){
/**
 * Assert Error function.
 * @param  {Boolean} condition Whether or not to throw error.
 * @param  {String} message    Error message.
 */
function assertError(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}
exports.assertError = assertError;

/**
 * Assert TypeError function.
 * @param  {Boolean} condition Whether or not to throw error.
 * @param  {String} message    Error message.
 */
function assertTypeError(test, type) {
    if (typeof test !== type) {
        throw new TypeError('Expected \'' + type +
            '\' but instead found \'' +
            typeof test + '\'');
    }
}
exports.assertTypeError = assertTypeError;

/**
 * Repeats a string `n` time.
 * @param  {String} str String to be repeated.
 * @param  {Number} n   Number of times to repeat.
 */
function repeat(str, n) {
    var result = '';

    for (var i = 0; i < n; i++) {
        result += str;
    }

    return result;
}
exports.repeat = repeat;

/**
 * Returns whatever you pass it.
 * @param  {Any} a CodeBuffer to slice.
 */
function varThrough(a) {
    return a;
}
exports.varThrough = varThrough;

/**
 * Stringified CodeBuffer slice.
 * @param  {CodeBuffer} code CodeBuffer to slice.
 * @param  {Number} range    Range to slice before and after `code.index`.
 */
function bufferSlice(code, range, format) {
    format = format || varThrough;
    return JSON.stringify(
            code.slice(Math.max(0, code.index - range), code.index)
        )
        .slice(1, -1) +
        format(
            JSON.stringify(code.charAt(code.index) || 'EOF')
            .slice(1, -1)
        ) +
        JSON.stringify(
            code.slice(
                code.index + 1,
                Math.min(code.length, code.index + 1 + range)
            )
        )
        .slice(1, -1);
}
exports.bufferSlice = bufferSlice;

},{}],42:[function(require,module,exports){
/**
 * @name generate.js
 * @author Michaelangelo Jong
 */

(function GeneratorScope() {
    /**
     * Assert Error function.
     * @param  {Boolean} condition Whether or not to throw error.
     * @param  {String} message    Error message.
     */
    function assertError(condition, message) {
        if (!condition) {
            throw new Error(message);
        }
    }

    /**
     * Assert TypeError function.
     * @param  {Boolean} condition Whether or not to throw error.
     * @param  {String} message    Error message.
     */
    function assertTypeError(test, type) {
        if (typeof test !== type) {
            throw new TypeError('Expected \'' + type +
                '\' but instead found \'' +
                typeof test + '\'');
        }
    }

    /**
     * Returns the name of function 'func'.
     * @param  {Function} func Any function.
     * @return {String}        Name of 'func'.
     */
    function getFunctionName(func) {
        if (func.name !== void(0)) {
            return func.name;
        }
        // Else use IE Shim
        var funcNameMatch = func.toString()
            .match(/function\s*([^\s]*)\s*\(/);
        func.name = (funcNameMatch && funcNameMatch[1]) || '';
        return func.name;
    }

    /**
     * Returns true if 'obj' is an object containing only get and set functions, false otherwise.
     * @param  {Any} obj Value to be tested.
     * @return {Boolean} true or false.
     */
    function isGetSet(obj) {
        var keys, length;
        if (obj && typeof obj === 'object') {
            keys = Object.getOwnPropertyNames(obj)
                .sort();
            length = keys.length;

            if ((length === 1 && (keys[0] === 'get' && typeof obj.get ===
                    'function' ||
                    keys[0] === 'set' && typeof obj.set === 'function'
                )) ||
                (length === 2 && (keys[0] === 'get' && typeof obj.get ===
                    'function' &&
                    keys[1] === 'set' && typeof obj.set === 'function'
                ))) {
                return true;
            }
        }
        return false;
    }

    /**
     * Defines properties on 'obj'.
     * @param  {Object} obj        An object that 'properties' will be attached to.
     * @param  {Object} descriptor Optional object descriptor that will be applied to all attaching properties on 'properties'.
     * @param  {Object} properties An object who's properties will be attached to 'obj'.
     * @return {Generator}         'obj'.
     */
    function defineObjectProperties(obj, descriptor, properties) {
        var setProperties = {},
            i,
            keys,
            length,

            p = properties || descriptor,
            d = properties && descriptor;

        properties = (p && typeof p === 'object') ? p : {};
        descriptor = (d && typeof d === 'object') ? d : {};

        keys = Object.getOwnPropertyNames(properties);
        length = keys.length;

        for (i = 0; i < length; i++) {
            if (isGetSet(properties[keys[i]])) {
                setProperties[keys[i]] = {
                    configurable: !!descriptor.configurable,
                    enumerable: !!descriptor.enumerable,
                    get: properties[keys[i]].get,
                    set: properties[keys[i]].set
                };
            } else {
                setProperties[keys[i]] = {
                    configurable: !!descriptor.configurable,
                    enumerable: !!descriptor.enumerable,
                    writable: !!descriptor.writable,
                    value: properties[keys[i]]
                };
            }
        }
        Object.defineProperties(obj, setProperties);
        return obj;
    }



    var Creation = {
        /**
         * Defines properties on this object.
         * @param  {Object} descriptor Optional object descriptor that will be applied to all attaching properties.
         * @param  {Object} properties An object who's properties will be attached to this object.
         * @return {Object}            This object.
         */
        defineProperties: function defineProperties(descriptor,
            properties) {
            defineObjectProperties(this, descriptor,
                properties);
            return this;
        },

        /**
         * returns the prototype of `this` Creation.
         * @return {Object} Prototype of `this` Creation.
         */
        getProto: function getProto() {
            return Object.getPrototypeOf(this);
        },

        /**
         * returns the prototype of `this` super Creation.
         * @return {Object} Prototype of `this` super Creation.
         */
        getSuper: function getSuper() {
            return Object.getPrototypeOf(this.constructor.prototype);
        }
    };

    var Generation = {
        /**
         * Returns true if 'generator' was generated by this Generator.
         * @param  {Generator} generator A Generator.
         * @return {Boolean}             true or false.
         */
        isGeneration: function isGeneration(generator) {
            assertTypeError(generator, 'function');

            var _ = this;

            return _.prototype.isPrototypeOf(generator.prototype);
        },

        /**
         * Returns true if 'object' was created by this Generator.
         * @param  {Object} object An Object.
         * @return {Boolean}       true or false.
         */
        isCreation: function isCreation(object) {
            var _ = this;
            return object instanceof _;
        },
        /**
         * Generates a new generator that inherits from `this` generator.
         * @param {Generator} ParentGenerator Generator to inherit from.
         * @param {Function} create           Create method that gets called when creating a new instance of new generator.
         * @return {Generator}                New Generator that inherits from 'ParentGenerator'.
         */
        generate: function generate(construct) {
            assertTypeError(construct, 'function');

            var _ = this;

            defineObjectProperties(
                construct, {
                    configurable: false,
                    enumerable: false,
                    writable: false
                }, {
                    prototype: Object.create(_.prototype)
                }
            );

            defineObjectProperties(
                construct, {
                    configurable: false,
                    enumerable: false,
                    writable: false
                },
                Generation
            );

            defineObjectProperties(
                construct.prototype, {
                    configurable: false,
                    enumerable: false,
                    writable: false
                }, {
                    constructor: construct,
                    generator: construct,
                }
            );

            return construct;
        },

        /**
         * Defines shared properties for all objects created by this generator.
         * @param  {Object} descriptor Optional object descriptor that will be applied to all attaching properties.
         * @param  {Object} properties An object who's properties will be attached to this generator's prototype.
         * @return {Generator}         This generator.
         */
        definePrototype: function definePrototype(descriptor,
            properties) {
            defineObjectProperties(this.prototype,
                descriptor,
                properties);
            return this;
        }
    };

    function Generator() {}

    defineObjectProperties(
        Generator, {
            configurable: false,
            enumerable: false,
            writable: false
        }, {
            prototype: Generator.prototype
        }
    );

    defineObjectProperties(
        Generator.prototype, {
            configurable: false,
            enumerable: false,
            writable: false
        },
        Creation
    );

    defineObjectProperties(
        Generator, {
            configurable: false,
            enumerable: false,
            writable: false
        },
        Generation
    );

    defineObjectProperties(
        Generator, {
            configurable: false,
            enumerable: false,
            writable: false
        }, {
            /**
             * Returns true if 'generator' was generated by this Generator.
             * @param  {Generator} generator A Generator.
             * @return {Boolean}             true or false.
             */
            isGenerator: function isGenerator(generator) {
                return this.isGeneration(generator);
            },

            /**
             * Generates a new generator that inherits from `this` generator.
             * @param {Generator} extendFrom      Constructor to inherit from.
             * @param {Function} create           Create method that gets called when creating a new instance of new generator.
             * @return {Generator}                New Generator that inherits from 'ParentGenerator'.
             */
            toGenerator: function toGenerator(extendFrom, create) {
                console.warn(
                    'Generator.toGenerator is depreciated please use Generator.generateFrom'
                );
                return this.generateFrom(extendFrom, create);
            },

            /**
             * Generates a new generator that inherits from `this` generator.
             * @param {Constructor} extendFrom    Constructor to inherit from.
             * @param {Function} create           Create method that gets called when creating a new instance of new generator.
             * @return {Generator}                New Generator that inherits from 'ParentGenerator'.
             */
            generateFrom: function generateFrom(extendFrom, create) {
                assertTypeError(extendFrom, 'function');
                assertTypeError(create, 'function');

                defineObjectProperties(
                    create, {
                        configurable: false,
                        enumerable: false,
                        writable: false
                    }, {
                        prototype: Object.create(extendFrom.prototype),
                    }
                );

                defineObjectProperties(
                    create, {
                        configurable: false,
                        enumerable: false,
                        writable: false
                    },
                    Generation
                );

                defineObjectProperties(
                    create.prototype, {
                        configurable: false,
                        enumerable: false,
                        writable: false
                    }, {
                        constructor: create,
                        generator: create,
                    }
                );

                defineObjectProperties(
                    create.prototype, {
                        configurable: false,
                        enumerable: false,
                        writable: false
                    },
                    Creation
                );

                return create;
            }
        }
    );

    Object.freeze(Generator);
    Object.freeze(Generator.prototype);

    // Exports
    if (typeof define === 'function' && define.amd) {
        // AMD
        define(function () {
            return Generator;
        });
    } else if (typeof module === 'object' && typeof exports === 'object') {
        // Node/CommonJS
        module.exports = Generator;
    } else {
        // Browser global
        window.Generator = Generator;
    }

}());

},{}],43:[function(require,module,exports){
(function (global){
var topLevel = typeof global !== 'undefined' ? global :
    typeof window !== 'undefined' ? window : {}
var minDoc = require('min-document');

if (typeof document !== 'undefined') {
    module.exports = document;
} else {
    var doccy = topLevel['__GLOBAL_DOCUMENT_CACHE@4'];

    if (!doccy) {
        doccy = topLevel['__GLOBAL_DOCUMENT_CACHE@4'] = minDoc;
    }

    module.exports = doccy;
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"min-document":35}],44:[function(require,module,exports){
"use strict";

module.exports = function isObject(x) {
	return typeof x === "object" && x !== null;
};

},{}],45:[function(require,module,exports){
var createElement = require("./vdom/create-element.js")

module.exports = createElement

},{"./vdom/create-element.js":49}],46:[function(require,module,exports){
var diff = require("./vtree/diff.js")

module.exports = diff

},{"./vtree/diff.js":63}],47:[function(require,module,exports){
var patch = require("./vdom/patch.js")

module.exports = patch

},{"./vdom/patch.js":52}],48:[function(require,module,exports){
var isObject = require("is-object")
var isHook = require("../vnode/is-vhook.js")

module.exports = applyProperties

function applyProperties(node, props, previous) {
    for (var propName in props) {
        var propValue = props[propName]

        if (propValue === undefined) {
            removeProperty(node, propName, propValue, previous);
        } else if (isHook(propValue)) {
            removeProperty(node, propName, propValue, previous)
            if (propValue.hook) {
                propValue.hook(node,
                    propName,
                    previous ? previous[propName] : undefined)
            }
        } else {
            if (isObject(propValue)) {
                patchObject(node, props, previous, propName, propValue);
            } else {
                node[propName] = propValue
            }
        }
    }
}

function removeProperty(node, propName, propValue, previous) {
    if (previous) {
        var previousValue = previous[propName]

        if (!isHook(previousValue)) {
            if (propName === "attributes") {
                for (var attrName in previousValue) {
                    node.removeAttribute(attrName)
                }
            } else if (propName === "style") {
                for (var i in previousValue) {
                    node.style[i] = ""
                }
            } else if (typeof previousValue === "string") {
                node[propName] = ""
            } else {
                node[propName] = null
            }
        } else if (previousValue.unhook) {
            previousValue.unhook(node, propName, propValue)
        }
    }
}

function patchObject(node, props, previous, propName, propValue) {
    var previousValue = previous ? previous[propName] : undefined

    // Set attributes
    if (propName === "attributes") {
        for (var attrName in propValue) {
            var attrValue = propValue[attrName]

            if (attrValue === undefined) {
                node.removeAttribute(attrName)
            } else {
                node.setAttribute(attrName, attrValue)
            }
        }

        return
    }

    if(previousValue && isObject(previousValue) &&
        getPrototype(previousValue) !== getPrototype(propValue)) {
        node[propName] = propValue
        return
    }

    if (!isObject(node[propName])) {
        node[propName] = {}
    }

    var replacer = propName === "style" ? "" : undefined

    for (var k in propValue) {
        var value = propValue[k]
        node[propName][k] = (value === undefined) ? replacer : value
    }
}

function getPrototype(value) {
    if (Object.getPrototypeOf) {
        return Object.getPrototypeOf(value)
    } else if (value.__proto__) {
        return value.__proto__
    } else if (value.constructor) {
        return value.constructor.prototype
    }
}

},{"../vnode/is-vhook.js":56,"is-object":44}],49:[function(require,module,exports){
var document = require("global/document")

var applyProperties = require("./apply-properties")

var isVNode = require("../vnode/is-vnode.js")
var isVText = require("../vnode/is-vtext.js")
var isWidget = require("../vnode/is-widget.js")
var handleThunk = require("../vnode/handle-thunk.js")

module.exports = createElement

function createElement(vnode, opts) {
    var doc = opts ? opts.document || document : document
    var warn = opts ? opts.warn : null

    vnode = handleThunk(vnode).a

    if (isWidget(vnode)) {
        return vnode.init()
    } else if (isVText(vnode)) {
        return doc.createTextNode(vnode.text)
    } else if (!isVNode(vnode)) {
        if (warn) {
            warn("Item is not a valid virtual dom node", vnode)
        }
        return null
    }

    var node = (vnode.namespace === null) ?
        doc.createElement(vnode.tagName) :
        doc.createElementNS(vnode.namespace, vnode.tagName)

    var props = vnode.properties
    applyProperties(node, props)

    var children = vnode.children

    for (var i = 0; i < children.length; i++) {
        var childNode = createElement(children[i], opts)
        if (childNode) {
            node.appendChild(childNode)
        }
    }

    return node
}

},{"../vnode/handle-thunk.js":54,"../vnode/is-vnode.js":57,"../vnode/is-vtext.js":58,"../vnode/is-widget.js":59,"./apply-properties":48,"global/document":43}],50:[function(require,module,exports){
// Maps a virtual DOM tree onto a real DOM tree in an efficient manner.
// We don't want to read all of the DOM nodes in the tree so we use
// the in-order tree indexing to eliminate recursion down certain branches.
// We only recurse into a DOM node if we know that it contains a child of
// interest.

var noChild = {}

module.exports = domIndex

function domIndex(rootNode, tree, indices, nodes) {
    if (!indices || indices.length === 0) {
        return {}
    } else {
        indices.sort(ascending)
        return recurse(rootNode, tree, indices, nodes, 0)
    }
}

function recurse(rootNode, tree, indices, nodes, rootIndex) {
    nodes = nodes || {}


    if (rootNode) {
        if (indexInRange(indices, rootIndex, rootIndex)) {
            nodes[rootIndex] = rootNode
        }

        var vChildren = tree.children

        if (vChildren) {

            var childNodes = rootNode.childNodes

            for (var i = 0; i < tree.children.length; i++) {
                rootIndex += 1

                var vChild = vChildren[i] || noChild
                var nextIndex = rootIndex + (vChild.count || 0)

                // skip recursion down the tree if there are no nodes down here
                if (indexInRange(indices, rootIndex, nextIndex)) {
                    recurse(childNodes[i], vChild, indices, nodes, rootIndex)
                }

                rootIndex = nextIndex
            }
        }
    }

    return nodes
}

// Binary search for an index in the interval [left, right]
function indexInRange(indices, left, right) {
    if (indices.length === 0) {
        return false
    }

    var minIndex = 0
    var maxIndex = indices.length - 1
    var currentIndex
    var currentItem

    while (minIndex <= maxIndex) {
        currentIndex = ((maxIndex + minIndex) / 2) >> 0
        currentItem = indices[currentIndex]

        if (minIndex === maxIndex) {
            return currentItem >= left && currentItem <= right
        } else if (currentItem < left) {
            minIndex = currentIndex + 1
        } else  if (currentItem > right) {
            maxIndex = currentIndex - 1
        } else {
            return true
        }
    }

    return false;
}

function ascending(a, b) {
    return a > b ? 1 : -1
}

},{}],51:[function(require,module,exports){
var applyProperties = require("./apply-properties")

var isWidget = require("../vnode/is-widget.js")
var VPatch = require("../vnode/vpatch.js")

var updateWidget = require("./update-widget")

module.exports = applyPatch

function applyPatch(vpatch, domNode, renderOptions) {
    var type = vpatch.type
    var vNode = vpatch.vNode
    var patch = vpatch.patch

    switch (type) {
        case VPatch.REMOVE:
            return removeNode(domNode, vNode)
        case VPatch.INSERT:
            return insertNode(domNode, patch, renderOptions)
        case VPatch.VTEXT:
            return stringPatch(domNode, vNode, patch, renderOptions)
        case VPatch.WIDGET:
            return widgetPatch(domNode, vNode, patch, renderOptions)
        case VPatch.VNODE:
            return vNodePatch(domNode, vNode, patch, renderOptions)
        case VPatch.ORDER:
            reorderChildren(domNode, patch)
            return domNode
        case VPatch.PROPS:
            applyProperties(domNode, patch, vNode.properties)
            return domNode
        case VPatch.THUNK:
            return replaceRoot(domNode,
                renderOptions.patch(domNode, patch, renderOptions))
        default:
            return domNode
    }
}

function removeNode(domNode, vNode) {
    var parentNode = domNode.parentNode

    if (parentNode) {
        parentNode.removeChild(domNode)
    }

    destroyWidget(domNode, vNode);

    return null
}

function insertNode(parentNode, vNode, renderOptions) {
    var newNode = renderOptions.render(vNode, renderOptions)

    if (parentNode) {
        parentNode.appendChild(newNode)
    }

    return parentNode
}

function stringPatch(domNode, leftVNode, vText, renderOptions) {
    var newNode

    if (domNode.nodeType === 3) {
        domNode.replaceData(0, domNode.length, vText.text)
        newNode = domNode
    } else {
        var parentNode = domNode.parentNode
        newNode = renderOptions.render(vText, renderOptions)

        if (parentNode && newNode !== domNode) {
            parentNode.replaceChild(newNode, domNode)
        }
    }

    return newNode
}

function widgetPatch(domNode, leftVNode, widget, renderOptions) {
    var updating = updateWidget(leftVNode, widget)
    var newNode

    if (updating) {
        newNode = widget.update(leftVNode, domNode) || domNode
    } else {
        newNode = renderOptions.render(widget, renderOptions)
    }

    var parentNode = domNode.parentNode

    if (parentNode && newNode !== domNode) {
        parentNode.replaceChild(newNode, domNode)
    }

    if (!updating) {
        destroyWidget(domNode, leftVNode)
    }

    return newNode
}

function vNodePatch(domNode, leftVNode, vNode, renderOptions) {
    var parentNode = domNode.parentNode
    var newNode = renderOptions.render(vNode, renderOptions)

    if (parentNode && newNode !== domNode) {
        parentNode.replaceChild(newNode, domNode)
    }

    return newNode
}

function destroyWidget(domNode, w) {
    if (typeof w.destroy === "function" && isWidget(w)) {
        w.destroy(domNode)
    }
}

function reorderChildren(domNode, moves) {
    var childNodes = domNode.childNodes
    var keyMap = {}
    var node
    var remove
    var insert

    for (var i = 0; i < moves.removes.length; i++) {
        remove = moves.removes[i]
        node = childNodes[remove.from]
        if (remove.key) {
            keyMap[remove.key] = node
        }
        domNode.removeChild(node)
    }

    var length = childNodes.length
    for (var j = 0; j < moves.inserts.length; j++) {
        insert = moves.inserts[j]
        node = keyMap[insert.key]
        // this is the weirdest bug i've ever seen in webkit
        domNode.insertBefore(node, insert.to >= length++ ? null : childNodes[insert.to])
    }
}

function replaceRoot(oldRoot, newRoot) {
    if (oldRoot && newRoot && oldRoot !== newRoot && oldRoot.parentNode) {
        oldRoot.parentNode.replaceChild(newRoot, oldRoot)
    }

    return newRoot;
}

},{"../vnode/is-widget.js":59,"../vnode/vpatch.js":61,"./apply-properties":48,"./update-widget":53}],52:[function(require,module,exports){
var document = require("global/document")
var isArray = require("x-is-array")

var render = require("./create-element")
var domIndex = require("./dom-index")
var patchOp = require("./patch-op")
module.exports = patch

function patch(rootNode, patches, renderOptions) {
    renderOptions = renderOptions || {}
    renderOptions.patch = renderOptions.patch && renderOptions.patch !== patch
        ? renderOptions.patch
        : patchRecursive
    renderOptions.render = renderOptions.render || render

    return renderOptions.patch(rootNode, patches, renderOptions)
}

function patchRecursive(rootNode, patches, renderOptions) {
    var indices = patchIndices(patches)

    if (indices.length === 0) {
        return rootNode
    }

    var index = domIndex(rootNode, patches.a, indices)
    var ownerDocument = rootNode.ownerDocument

    if (!renderOptions.document && ownerDocument !== document) {
        renderOptions.document = ownerDocument
    }

    for (var i = 0; i < indices.length; i++) {
        var nodeIndex = indices[i]
        rootNode = applyPatch(rootNode,
            index[nodeIndex],
            patches[nodeIndex],
            renderOptions)
    }

    return rootNode
}

function applyPatch(rootNode, domNode, patchList, renderOptions) {
    if (!domNode) {
        return rootNode
    }

    var newNode

    if (isArray(patchList)) {
        for (var i = 0; i < patchList.length; i++) {
            newNode = patchOp(patchList[i], domNode, renderOptions)

            if (domNode === rootNode) {
                rootNode = newNode
            }
        }
    } else {
        newNode = patchOp(patchList, domNode, renderOptions)

        if (domNode === rootNode) {
            rootNode = newNode
        }
    }

    return rootNode
}

function patchIndices(patches) {
    var indices = []

    for (var key in patches) {
        if (key !== "a") {
            indices.push(Number(key))
        }
    }

    return indices
}

},{"./create-element":49,"./dom-index":50,"./patch-op":51,"global/document":43,"x-is-array":64}],53:[function(require,module,exports){
var isWidget = require("../vnode/is-widget.js")

module.exports = updateWidget

function updateWidget(a, b) {
    if (isWidget(a) && isWidget(b)) {
        if ("name" in a && "name" in b) {
            return a.id === b.id
        } else {
            return a.init === b.init
        }
    }

    return false
}

},{"../vnode/is-widget.js":59}],54:[function(require,module,exports){
var isVNode = require("./is-vnode")
var isVText = require("./is-vtext")
var isWidget = require("./is-widget")
var isThunk = require("./is-thunk")

module.exports = handleThunk

function handleThunk(a, b) {
    var renderedA = a
    var renderedB = b

    if (isThunk(b)) {
        renderedB = renderThunk(b, a)
    }

    if (isThunk(a)) {
        renderedA = renderThunk(a, null)
    }

    return {
        a: renderedA,
        b: renderedB
    }
}

function renderThunk(thunk, previous) {
    var renderedThunk = thunk.vnode

    if (!renderedThunk) {
        renderedThunk = thunk.vnode = thunk.render(previous)
    }

    if (!(isVNode(renderedThunk) ||
            isVText(renderedThunk) ||
            isWidget(renderedThunk))) {
        throw new Error("thunk did not return a valid node");
    }

    return renderedThunk
}

},{"./is-thunk":55,"./is-vnode":57,"./is-vtext":58,"./is-widget":59}],55:[function(require,module,exports){
module.exports = isThunk

function isThunk(t) {
    return t && t.type === "Thunk"
}

},{}],56:[function(require,module,exports){
module.exports = isHook

function isHook(hook) {
    return hook &&
      (typeof hook.hook === "function" && !hook.hasOwnProperty("hook") ||
       typeof hook.unhook === "function" && !hook.hasOwnProperty("unhook"))
}

},{}],57:[function(require,module,exports){
var version = require("./version")

module.exports = isVirtualNode

function isVirtualNode(x) {
    return x && x.type === "VirtualNode" && x.version === version
}

},{"./version":60}],58:[function(require,module,exports){
var version = require("./version")

module.exports = isVirtualText

function isVirtualText(x) {
    return x && x.type === "VirtualText" && x.version === version
}

},{"./version":60}],59:[function(require,module,exports){
module.exports = isWidget

function isWidget(w) {
    return w && w.type === "Widget"
}

},{}],60:[function(require,module,exports){
module.exports = "2"

},{}],61:[function(require,module,exports){
var version = require("./version")

VirtualPatch.NONE = 0
VirtualPatch.VTEXT = 1
VirtualPatch.VNODE = 2
VirtualPatch.WIDGET = 3
VirtualPatch.PROPS = 4
VirtualPatch.ORDER = 5
VirtualPatch.INSERT = 6
VirtualPatch.REMOVE = 7
VirtualPatch.THUNK = 8

module.exports = VirtualPatch

function VirtualPatch(type, vNode, patch) {
    this.type = Number(type)
    this.vNode = vNode
    this.patch = patch
}

VirtualPatch.prototype.version = version
VirtualPatch.prototype.type = "VirtualPatch"

},{"./version":60}],62:[function(require,module,exports){
var isObject = require("is-object")
var isHook = require("../vnode/is-vhook")

module.exports = diffProps

function diffProps(a, b) {
    var diff

    for (var aKey in a) {
        if (!(aKey in b)) {
            diff = diff || {}
            diff[aKey] = undefined
        }

        var aValue = a[aKey]
        var bValue = b[aKey]

        if (aValue === bValue) {
            continue
        } else if (isObject(aValue) && isObject(bValue)) {
            if (getPrototype(bValue) !== getPrototype(aValue)) {
                diff = diff || {}
                diff[aKey] = bValue
            } else if (isHook(bValue)) {
                 diff = diff || {}
                 diff[aKey] = bValue
            } else {
                var objectDiff = diffProps(aValue, bValue)
                if (objectDiff) {
                    diff = diff || {}
                    diff[aKey] = objectDiff
                }
            }
        } else {
            diff = diff || {}
            diff[aKey] = bValue
        }
    }

    for (var bKey in b) {
        if (!(bKey in a)) {
            diff = diff || {}
            diff[bKey] = b[bKey]
        }
    }

    return diff
}

function getPrototype(value) {
  if (Object.getPrototypeOf) {
    return Object.getPrototypeOf(value)
  } else if (value.__proto__) {
    return value.__proto__
  } else if (value.constructor) {
    return value.constructor.prototype
  }
}

},{"../vnode/is-vhook":56,"is-object":44}],63:[function(require,module,exports){
var isArray = require("x-is-array")

var VPatch = require("../vnode/vpatch")
var isVNode = require("../vnode/is-vnode")
var isVText = require("../vnode/is-vtext")
var isWidget = require("../vnode/is-widget")
var isThunk = require("../vnode/is-thunk")
var handleThunk = require("../vnode/handle-thunk")

var diffProps = require("./diff-props")

module.exports = diff

function diff(a, b) {
    var patch = { a: a }
    walk(a, b, patch, 0)
    return patch
}

function walk(a, b, patch, index) {
    if (a === b) {
        return
    }

    var apply = patch[index]
    var applyClear = false

    if (isThunk(a) || isThunk(b)) {
        thunks(a, b, patch, index)
    } else if (b == null) {

        // If a is a widget we will add a remove patch for it
        // Otherwise any child widgets/hooks must be destroyed.
        // This prevents adding two remove patches for a widget.
        if (!isWidget(a)) {
            clearState(a, patch, index)
            apply = patch[index]
        }

        apply = appendPatch(apply, new VPatch(VPatch.REMOVE, a, b))
    } else if (isVNode(b)) {
        if (isVNode(a)) {
            if (a.tagName === b.tagName &&
                a.namespace === b.namespace &&
                a.key === b.key) {
                var propsPatch = diffProps(a.properties, b.properties)
                if (propsPatch) {
                    apply = appendPatch(apply,
                        new VPatch(VPatch.PROPS, a, propsPatch))
                }
                apply = diffChildren(a, b, patch, apply, index)
            } else {
                apply = appendPatch(apply, new VPatch(VPatch.VNODE, a, b))
                applyClear = true
            }
        } else {
            apply = appendPatch(apply, new VPatch(VPatch.VNODE, a, b))
            applyClear = true
        }
    } else if (isVText(b)) {
        if (!isVText(a)) {
            apply = appendPatch(apply, new VPatch(VPatch.VTEXT, a, b))
            applyClear = true
        } else if (a.text !== b.text) {
            apply = appendPatch(apply, new VPatch(VPatch.VTEXT, a, b))
        }
    } else if (isWidget(b)) {
        if (!isWidget(a)) {
            applyClear = true
        }

        apply = appendPatch(apply, new VPatch(VPatch.WIDGET, a, b))
    }

    if (apply) {
        patch[index] = apply
    }

    if (applyClear) {
        clearState(a, patch, index)
    }
}

function diffChildren(a, b, patch, apply, index) {
    var aChildren = a.children
    var orderedSet = reorder(aChildren, b.children)
    var bChildren = orderedSet.children

    var aLen = aChildren.length
    var bLen = bChildren.length
    var len = aLen > bLen ? aLen : bLen

    for (var i = 0; i < len; i++) {
        var leftNode = aChildren[i]
        var rightNode = bChildren[i]
        index += 1

        if (!leftNode) {
            if (rightNode) {
                // Excess nodes in b need to be added
                apply = appendPatch(apply,
                    new VPatch(VPatch.INSERT, null, rightNode))
            }
        } else {
            walk(leftNode, rightNode, patch, index)
        }

        if (isVNode(leftNode) && leftNode.count) {
            index += leftNode.count
        }
    }

    if (orderedSet.moves) {
        // Reorder nodes last
        apply = appendPatch(apply, new VPatch(
            VPatch.ORDER,
            a,
            orderedSet.moves
        ))
    }

    return apply
}

function clearState(vNode, patch, index) {
    // TODO: Make this a single walk, not two
    unhook(vNode, patch, index)
    destroyWidgets(vNode, patch, index)
}

// Patch records for all destroyed widgets must be added because we need
// a DOM node reference for the destroy function
function destroyWidgets(vNode, patch, index) {
    if (isWidget(vNode)) {
        if (typeof vNode.destroy === "function") {
            patch[index] = appendPatch(
                patch[index],
                new VPatch(VPatch.REMOVE, vNode, null)
            )
        }
    } else if (isVNode(vNode) && (vNode.hasWidgets || vNode.hasThunks)) {
        var children = vNode.children
        var len = children.length
        for (var i = 0; i < len; i++) {
            var child = children[i]
            index += 1

            destroyWidgets(child, patch, index)

            if (isVNode(child) && child.count) {
                index += child.count
            }
        }
    } else if (isThunk(vNode)) {
        thunks(vNode, null, patch, index)
    }
}

// Create a sub-patch for thunks
function thunks(a, b, patch, index) {
    var nodes = handleThunk(a, b)
    var thunkPatch = diff(nodes.a, nodes.b)
    if (hasPatches(thunkPatch)) {
        patch[index] = new VPatch(VPatch.THUNK, null, thunkPatch)
    }
}

function hasPatches(patch) {
    for (var index in patch) {
        if (index !== "a") {
            return true
        }
    }

    return false
}

// Execute hooks when two nodes are identical
function unhook(vNode, patch, index) {
    if (isVNode(vNode)) {
        if (vNode.hooks) {
            patch[index] = appendPatch(
                patch[index],
                new VPatch(
                    VPatch.PROPS,
                    vNode,
                    undefinedKeys(vNode.hooks)
                )
            )
        }

        if (vNode.descendantHooks || vNode.hasThunks) {
            var children = vNode.children
            var len = children.length
            for (var i = 0; i < len; i++) {
                var child = children[i]
                index += 1

                unhook(child, patch, index)

                if (isVNode(child) && child.count) {
                    index += child.count
                }
            }
        }
    } else if (isThunk(vNode)) {
        thunks(vNode, null, patch, index)
    }
}

function undefinedKeys(obj) {
    var result = {}

    for (var key in obj) {
        result[key] = undefined
    }

    return result
}

// List diff, naive left to right reordering
function reorder(aChildren, bChildren) {
    // O(M) time, O(M) memory
    var bChildIndex = keyIndex(bChildren)
    var bKeys = bChildIndex.keys
    var bFree = bChildIndex.free

    if (bFree.length === bChildren.length) {
        return {
            children: bChildren,
            moves: null
        }
    }

    // O(N) time, O(N) memory
    var aChildIndex = keyIndex(aChildren)
    var aKeys = aChildIndex.keys
    var aFree = aChildIndex.free

    if (aFree.length === aChildren.length) {
        return {
            children: bChildren,
            moves: null
        }
    }

    // O(MAX(N, M)) memory
    var newChildren = []

    var freeIndex = 0
    var freeCount = bFree.length
    var deletedItems = 0

    // Iterate through a and match a node in b
    // O(N) time,
    for (var i = 0 ; i < aChildren.length; i++) {
        var aItem = aChildren[i]
        var itemIndex

        if (aItem.key) {
            if (bKeys.hasOwnProperty(aItem.key)) {
                // Match up the old keys
                itemIndex = bKeys[aItem.key]
                newChildren.push(bChildren[itemIndex])

            } else {
                // Remove old keyed items
                itemIndex = i - deletedItems++
                newChildren.push(null)
            }
        } else {
            // Match the item in a with the next free item in b
            if (freeIndex < freeCount) {
                itemIndex = bFree[freeIndex++]
                newChildren.push(bChildren[itemIndex])
            } else {
                // There are no free items in b to match with
                // the free items in a, so the extra free nodes
                // are deleted.
                itemIndex = i - deletedItems++
                newChildren.push(null)
            }
        }
    }

    var lastFreeIndex = freeIndex >= bFree.length ?
        bChildren.length :
        bFree[freeIndex]

    // Iterate through b and append any new keys
    // O(M) time
    for (var j = 0; j < bChildren.length; j++) {
        var newItem = bChildren[j]

        if (newItem.key) {
            if (!aKeys.hasOwnProperty(newItem.key)) {
                // Add any new keyed items
                // We are adding new items to the end and then sorting them
                // in place. In future we should insert new items in place.
                newChildren.push(newItem)
            }
        } else if (j >= lastFreeIndex) {
            // Add any leftover non-keyed items
            newChildren.push(newItem)
        }
    }

    var simulate = newChildren.slice()
    var simulateIndex = 0
    var removes = []
    var inserts = []
    var simulateItem

    for (var k = 0; k < bChildren.length;) {
        var wantedItem = bChildren[k]
        simulateItem = simulate[simulateIndex]

        // remove items
        while (simulateItem === null && simulate.length) {
            removes.push(remove(simulate, simulateIndex, null))
            simulateItem = simulate[simulateIndex]
        }

        if (!simulateItem || simulateItem.key !== wantedItem.key) {
            // if we need a key in this position...
            if (wantedItem.key) {
                if (simulateItem && simulateItem.key) {
                    // if an insert doesn't put this key in place, it needs to move
                    if (bKeys[simulateItem.key] !== k + 1) {
                        removes.push(remove(simulate, simulateIndex, simulateItem.key))
                        simulateItem = simulate[simulateIndex]
                        // if the remove didn't put the wanted item in place, we need to insert it
                        if (!simulateItem || simulateItem.key !== wantedItem.key) {
                            inserts.push({key: wantedItem.key, to: k})
                        }
                        // items are matching, so skip ahead
                        else {
                            simulateIndex++
                        }
                    }
                    else {
                        inserts.push({key: wantedItem.key, to: k})
                    }
                }
                else {
                    inserts.push({key: wantedItem.key, to: k})
                }
                k++
            }
            // a key in simulate has no matching wanted key, remove it
            else if (simulateItem && simulateItem.key) {
                removes.push(remove(simulate, simulateIndex, simulateItem.key))
            }
        }
        else {
            simulateIndex++
            k++
        }
    }

    // remove all the remaining nodes from simulate
    while(simulateIndex < simulate.length) {
        simulateItem = simulate[simulateIndex]
        removes.push(remove(simulate, simulateIndex, simulateItem && simulateItem.key))
    }

    // If the only moves we have are deletes then we can just
    // let the delete patch remove these items.
    if (removes.length === deletedItems && !inserts.length) {
        return {
            children: newChildren,
            moves: null
        }
    }

    return {
        children: newChildren,
        moves: {
            removes: removes,
            inserts: inserts
        }
    }
}

function remove(arr, index, key) {
    arr.splice(index, 1)

    return {
        from: index,
        key: key
    }
}

function keyIndex(children) {
    var keys = {}
    var free = []
    var length = children.length

    for (var i = 0; i < length; i++) {
        var child = children[i]

        if (child.key) {
            keys[child.key] = i
        } else {
            free.push(i)
        }
    }

    return {
        keys: keys,     // A hash of key name to index
        free: free      // An array of unkeyed item indices
    }
}

function appendPatch(apply, patch) {
    if (apply) {
        if (isArray(apply)) {
            apply.push(patch)
        } else {
            apply = [apply, patch]
        }

        return apply
    } else {
        return patch
    }
}

},{"../vnode/handle-thunk":54,"../vnode/is-thunk":55,"../vnode/is-vnode":57,"../vnode/is-vtext":58,"../vnode/is-widget":59,"../vnode/vpatch":61,"./diff-props":62,"x-is-array":64}],64:[function(require,module,exports){
var nativeIsArray = Array.isArray
var toString = Object.prototype.toString

module.exports = nativeIsArray || isArray

function isArray(obj) {
    return toString.call(obj) === "[object Array]"
}

},{}],65:[function(require,module,exports){
module.exports={
  "name": "bars",
  "version": "1.0.0",
  "description": "Bars is a lightweight high performance HTML aware templating engine.",
  "main": "index.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "repository": {
    "type": "git",
    "url": "git+https://github.com/Mike96Angelo/Bars.git"
  },
  "keywords": [
    "bars",
    "render",
    "renderer",
    "rendering",
    "template",
    "templating",
    "html"
  ],
  "author": "Michaelangelo Jong",
  "license": "MIT",
  "bugs": {
    "url": "https://github.com/Mike96Angelo/Bars/issues"
  },
  "homepage": "https://github.com/Mike96Angelo/Bars#readme",
  "dependencies": {
    "compileit": "^1.0.1",
    "generate-js": "^3.1.2",
    "jquery": "^3.1.1"
  },
  "devDependencies": {
    "browserify": "^13.1.1",
    "colors": "^1.1.2",
    "gulp": "^3.9.1",
    "gulp-minify": "0.0.14",
    "stringify": "^5.1.0",
    "vinyl-buffer": "^1.0.0",
    "vinyl-source-stream": "^1.1.0",
    "virtual-dom": "^2.1.1"
  }
}

},{}]},{},[1])(1)
});