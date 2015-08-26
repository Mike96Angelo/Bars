(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports = require('./lib');

},{"./lib":5}],2:[function(require,module,exports){
var struct = {
  'type': 'GROUP-NODE',
  'nodes': [
    {
      'type': 'TAG-NODE',
      'name': 'span',
      'nodes': [
        {
          'type': 'TEXT-NODE',
          'staticMap': {
            'textContent': 'hello, '
          }
        },
        {
          'type': 'IF-NODE',
          'consequent': {
            'type': 'GROUP-NODE',
            'nodes': [
              {
                'type': 'TAG-NODE',
                'name': 'h2',
                'nodes': [
                  {
                    'type': 'TEXT-NODE',
                    'contextMap': {
                      'textContent': 'name'
                    }
                  }
                ]
              }
            ]
          },
          'alternate': {
            'type': 'GROUP-NODE',
            'nodes': [
              {
                'type': 'TEXT-NODE',
                'staticMap': {
                  'textContent': 'Person'
                }
              }
            ]
          }
        },
        {
          'type': 'TEXT-NODE',
          'staticMap': {
            'textContent': '.'
          }
        }
      ]
    }
  ]
};


var Generator = require('generate-js'),
    Fragment = require('./fragment'),
    Tokenizer = require('./tokenizer');

var Bars = Generator.generate(function Bars() {
    var _ = this;

    _.defineProperties({
    });
});

Bars.definePrototype({
    // compile: function compile(template) {
    //     var _ = this;

    //     _.compiled = function() {
    //         return Fragment.create(_);
    //     };

    //     return _;
    // },

    parse: function parse(template) {
        var _ = this;

        return _.t.parse(template);
    },
});

module.exports = Bars;

var template = '<span>hello, {{if name}}<h2>{{name}}</h2>{{else}}Person{{/if}}.</span>';
var b = Bars.create();
var c = b.parse(template);


function parse(template) {
    var tree = {
            nodes: []
        },
        index = 0,
        length = template.length,
        ch, token;

    function parseTextNode(tree) {
        token = {
            type: 'TEXT-NODE',
            staticMap: {
                textContent: ''
            }
        };

        for (; index < length; index++) {
            ch = template[index];

            if (ch === '<') {
                index--;
                break;
            }

            token.staticMap.textContent += ch;
        }

        tree.nodes.push(token);
    }

    function parseTagNode(tree) {
        token = {
            type: 'TAG-NODE',
            name: ''
        };

        for (; index < length; index++) {
            ch = template[index];

            token.name += ch;

            if (ch === '>') {
                break;
            }
        }

        tree.nodes.push(token);
    }

    for (; index < length; index++) {
        ch = template[index];

        switch (ch) {
        case '<':
            parseTagNode(tree);
            break;
        default:
            parseTextNode(tree);
        }
    }

    return tree;
}



console.log(c)
// window.frag = Fragment.create(c);
// var aa = window.aa = frag.render();
// aa.appendTo(document.body);
// aa.update({name:'test'});

},{"./fragment":4,"./tokenizer":13,"generate-js":14}],3:[function(require,module,exports){
var Generator = require('generate-js');

function resolve(basepath, path) {
    var splitBasepath = basepath.split('/'),
        splitPath = path.split('/');

    if (path[0] === '/') {
        splitPath.shift();
        return splitPath;
    }
    splitBasepath.shift();

    while (splitPath[0] =='..') {
        splitPath.shift();
        splitBasepath.pop();
    }

    return splitBasepath.concat(splitPath);
}

var Context = Generator.generate(
    function Context(data) {
        var _ = this;

        _.data = data;
    }
);

Context.definePrototype({
    getValue: function getValue(splitPath) {
        var _ = this;

        var value = _.data;

        for (var i = 0; i < splitPath.length; i++) {
            if (splitPath[i] === '@key' || splitPath[i] === '@index') {
                value = splitPath[i - 1];
            } else {
                value = value[splitPath[i]];
            }
        }

        return value;
    },
    getContext: function getContext(basepath) {
        var _ = this;

        return function context(path) {
            return _.getValue(resolve(basepath, path));
        };
    },
});

module.exports = Context;

},{"generate-js":14}],4:[function(require,module,exports){
var Generator = require('generate-js'),
    Nodes = window.Nodes = require('./nodes'),
    Context = require('./context');

var Fragment = Generator.generate(function Fragment(struct) {
    var _ = this;

    _.defineProperties({
        struct: struct
    });
});

Fragment.definePrototype({
    render: function render(data) {
        var _ = this,
            context = Context.create(data);

        return _.build(context);
    },

    build: function build(context, struct) {
        var _ = this,
            i;

        struct = struct || _.struct;

        var node = Nodes[struct.type].create(_, context, {
            contextMap: struct.contextMap,
            staticMap: struct.staticMap,
            name: struct.name
        });

        if (node.type === 'IF-NODE') {
            if (struct.consequent && struct.consequent.nodes) {
                for (i = 0; i < struct.consequent.nodes.length; i++) {
                    node.consequent.appendChild( _.build(context, struct.consequent.nodes[i]) );
                }
            }

            if (struct.alternate && struct.alternate.nodes) {
                for (i = 0; i < struct.alternate.nodes.length; i++) {
                    node.alternate.appendChild( _.build(context, struct.alternate.nodes[i]) );
                }
            }
        } else if (struct.nodes) {
            for (i = 0; i < struct.nodes.length; i++) {
                node.appendChild( _.build(context, struct.nodes[i]) );
            }
        }

        return node;
    },
});

module.exports = Fragment;

},{"./context":3,"./nodes":8,"generate-js":14}],5:[function(require,module,exports){
require('./compilr');

},{"./compilr":2}],6:[function(require,module,exports){
var Node = require('./node');

/**
 * <span>hello, {{name}}.</span>
 */

var GroupNode = Node.generate(function GroupNode(fragment, context, options) {
    var _ = this;

    _.supercreate(fragment, context, options);
});

GroupNode.definePrototype({
    type: 'GROUP-NODE',

    update: function update(data) {
        var _ = this,
            context;

        if (typeof data === 'function') {
            context = data;
        } else {
            _.context.data = data;
            context = _.context.getContext('');
        }

        for (var i = 0; i < _.nodes.length; i++) {
            _.nodes[i].update(context);
        }
    },
    _elementAppendTo: function _elementAppendTo(parent) {
        var _ = this;
        console.log(_.type, _, parent);

        for (var i = 0; i < _.nodes.length; i++) {
            _.nodes[i]._elementAppendTo(parent);
            _.$parent = parent;
        }
    },
    _elementRemove: function _elementRemove() {
        var _ = this;

        for (var i = 0; i < _.nodes.length; i++) {
            _.nodes[i]._elementRemove();
        }
        _.$parent = null;
    },
});

module.exports = GroupNode;

},{"./node":10}],7:[function(require,module,exports){
var Node  = require('./node'),
    Group = require('./group');

var IfNode = Node.generate(function IfNode(fragment, context, options) {
    var _ = this;

    _.supercreate(fragment, context, options);

    _.defineProperties({
        consequent: Group.create(),
        alternate: Group.create()
    });

    _.consequent.parent = _;
    _.alternate.parent = _;

    _.con =true;
});

IfNode.definePrototype({
    type: 'IF-NODE',

    update: function(context) {
        var _ = this;

        _.condition(context);
    },

    condition: function condition(context) {
        var _ = this,
            con = !!window.IF;

        if (con) {
            _.consequent.update(context);
        } else {
            _.alternate.update(context);
        }

        _.con = con;

        _._elementAppendTo(_.$parent);
    },
    _elementAppendTo: function _elementAppendTo(parent) {
        var _ = this;
        console.log(_.type, _, parent);

        if (_.con) {
            _.alternate._elementRemove();
            _.consequent._elementAppendTo(parent);

            _.$parent = parent;

        } else {
            _.consequent._elementRemove();
            _.alternate._elementAppendTo(parent);

            _.$parent = parent;

        }
    },
    _elementRemove: function _elementRemove() {
        var _ = this;

        _.consequent._elementRemove();
        _.alternate._elementRemove();

        _.$parent = null;

    },
});

module.exports = IfNode;

},{"./group":6,"./node":10}],8:[function(require,module,exports){

exports['GROUP-NODE'] = require('./group');
exports['IF-NODE']    = require('./if');
exports['LOOP-NODE']  = require('./loop');
exports['TEXT-NODE']  = require('./text');
exports['TAG-NODE']   = require('./tag');


},{"./group":6,"./if":7,"./loop":9,"./tag":11,"./text":12}],9:[function(require,module,exports){
var Node = require('./node');
var GroupNode = require('./group');

var LoopNode = Node.generate(function LoopNode(fragment, context) {
    var _ = this;

    _.supercreate();

    _.defineProperties({
        alternate: [],
        consequent: [],
    });
});

LoopNode.definePrototype({
    type: 'LOOP-NODE',

    update: function(data) {
        var _ = this,
            i,
            keys;

        if (data instanceof Array) {
            for (i = 0; i < data.length; i++) {
                if (_.consequent[i]) {
                    _.append(_.consequent[i].update(data[i]));
                } else {
                    _.append(_.fragment.render(data[i]));
                }
            }

            for (i = data.length; i < _.consequent.length; i++) {
                _.consequent[i].remove();
            }

            for (i = 0; i < _.alternate.length; i++) {
                _.alternate[i].remove();
            }
        } else if (data && typeof data === 'object') {

            keys = Object.keys(data);

            for (i = 0; i < keys.length; i++) {
                if (_.consequent[i]) {
                    _.append(_.consequent[i].update(data[keys[i]]));
                } else {
                    _.append(_.fragment.render(data[keys[i]]));
                }
            }

            for (i = keys.length; i < _.consequent.length; i++) {
                _.consequent[i].remove();
            }

            for (i = 0; i < _.alternate.length; i++) {
                _.alternate[i].remove();
            }
        } else {
            for (i = 0; i < _.consequent.length; i++) {
                _.consequent[i].remove();
            }
            for (i = 0; i < _.alternate.length; i++) {
                _.append(_.alternate[i]);
            }
        }
    }
});

module.exports = LoopNode;

},{"./group":6,"./node":10}],10:[function(require,module,exports){
var Generator = require('generate-js');

var Node = Generator.generate(function Node(fragment, context, options) {
    var _ = this;

    _.defineProperties({
        fragment: fragment,
        context: context,
        nodes: []
    });

    _.defineProperties(options);
});

Node.definePrototype({
    type: 'NODE',
    update: function(context) {
        var _ = this;

        for (var key in _.contextMap) {
            _.$el[key] = context(_.contextMap[key]);
        }
    },
    prevDom: function prevDom() {
        var _ = this;

        if (!_.parent) return;

        var index = _.parent.nodes.indexOf(_);

        var prev = _.parent.nodes[index - 1] || null;

        if (!prev) {
            if (_.parent.type === 'TAG-NODE') {
                return;
            } else {
               return _.parent.prevDom();
            }
        }

        var lastDom = prev.lastDom();

        if (!lastDom) {
            return prev.prevDom();
        }

        return lastDom;

    },
    lastDom: function lastDom() {
        var _ = this;

        if (_.isDom()) {
            return _.$el;
        }

        return _.nodes[_.nodes.length - 1].prevDom();
    },
    isDom: function isDom() {
        var _ = this;
        return _.type === 'TEXT-NODE' || _.type === 'TAG-NODE';
    },
    appendChild: function appendChild(child) {
        var _ = this;

        _.nodes.push(child);
        child._elementAppendTo(_.$el);

        child.parent = _;

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
    _elementAppendTo: function _elementAppendTo(parent) {
        var _ = this;

        console.log(_.type, parent);

        if (parent instanceof Element && (_.$el instanceof Element || _.$el instanceof Text)) {
            var prev = _.prevDom();

            if (prev) {
                parent.insertBefore(_.$el, prev.nextSibling);
            } else {
                parent.appendChild(_.$el);
            }

            _.$parent = parent;
        }
    },
    _elementRemove: function _elementRemove() {
        var _ = this;

        if ((_.$el instanceof Element || _.$el instanceof Text) && _.$el.parentNode instanceof Element) {
            _.$el.parentNode.removeChild(_.$el);

            _.$parent = null;
        }
    },
    toJSON: function toJSON() {
        var _ = this;

        return {
            type: _.type,
            name: _.name,
            contextMap: _.contextMap,
            staticMap: _.staticMap,
            consequent: _.consequent,
            alternate: _.alternate,
            nodes: _.nodes.length ? _.nodes : void(0)
        };
    },
});

module.exports = Node;

},{"generate-js":14}],11:[function(require,module,exports){
var Node = require('./node');

var TagNode = Node.generate(function TagNode(fragment, context, options) {
    var _ = this;

    _.supercreate(fragment, context, options);

    _.defineProperties({
        $el: document.createElement(options.name),
        attrs: {
            // class: AttrNode()
        }
    });
});

TagNode.definePrototype({
    type: 'TAG-NODE',
    update: function update(data) {
        var _ = this;
        //self

        //then children
        for (var i = 0; i < _.nodes.length; i++) {
            _.nodes[i].update(data);
        }
    },
});

module.exports = TagNode;

},{"./node":10}],12:[function(require,module,exports){
var Node = require('./node');

var TextNode = Node.generate(function TextNode(fragment, context, options) {
    var _ = this;

    _.supercreate(fragment, context, options);

    _.defineProperties({
        $el: document.createTextNode(options.staticMap && options.staticMap.textContent)
    });
});

TextNode.definePrototype({
    type: 'TEXT-NODE',
});

module.exports = TextNode;

},{"./node":10}],13:[function(require,module,exports){
function Tokenizer(tokenDeffs) {
    if (!(this instanceof Tokenizer)) {
        return new Tokenizer(tokenDeffs);
    }

    this.tokenDeffs = [];
    tokenDeffs && this.addTokenDeff(tokenDeffs);
}

Tokenizer.Tokens = function Tokens(range, tokens) {
    var i;
    if (!(this instanceof Tokenizer.Tokens)) {
        return new Tokenizer.Tokens(range, tokens);
    }

    if (!(range instanceof Tokenizer.Range))
        throw new TypeError('First arument must be of type \'Tokenizer.Range\'.');
    if (!(tokens instanceof Array))
        throw new TypeError('Second arument must be of type \'Array\'.');
    for (i = 0; i < tokens.length; i++) {
        if (!(tokens[i] instanceof Tokenizer.Token))
            throw new TypeError('Second arument must be an array of only \'Tokenizer.Token\' type.');
    }

    this.range  = range;
    this.tokens = tokens;
};

Tokenizer.Token = function Token(id, str, range, ignore) {
    if (!(this instanceof Tokenizer.Token)) {
        return new Tokenizer.Token(id, str, range, ignore);
    }

    if (!(typeof id === 'string'))
        throw new TypeError('First arument must be of type \'String\'.');
    if (!(typeof str === 'string'))
        throw new TypeError('Second arument must be of type \'String\'.');
    if (!(range instanceof Tokenizer.Range))
        throw new TypeError('Thrid arument must be of type \'Tokenizer.Range\'.');

    this.id    = id;
    this.str   = str;
    this.range = range;
    this.ignore = !!ignore;
};

Tokenizer.Range = function Range(sLine, eLine, sCol, eCol, sIndex, eIndex) {
    var i;
    if (!(this instanceof Tokenizer.Range)) {
        return new Tokenizer.Range(sLine, eLine, sCol, eCol, sIndex, eIndex);
    }

    for (var i = 0; i < arguments.length; i++) {
        if (!(typeof arguments[i] === 'number'))
            throw new TypeError('Arument ' + i + ' must be of type \'Number\'.');
    }

    this.sLine  = sLine;
    this.eLine  = eLine;
    this.sCol   = sCol;
    this.eCol   = eCol;
    this.sIndex = sIndex;
    this.eIndex = eIndex;
};

Tokenizer.prototype.addTokenDeff = function (tokenDeffs) {
    var i, tokenDeff = {};
    if (tokenDeffs instanceof Array) {
        for (i = 0; i < tokenDeffs.length; i++) {
            this.addTokenDeff(tokenDeffs[i]);
        }
    } else if (tokenDeffs instanceof Object) {
        if ('id' in tokenDeffs && 'sChar' in tokenDeffs) {
            tokenDeff.id    = tokenDeffs.id;
            tokenDeff.sChar = tokenDeffs.sChar;

            if ('pToken' in tokenDeffs)
                tokenDeff.pToken = tokenDeffs.pToken;
            if ('tChar' in tokenDeffs)
                tokenDeff.tChar = tokenDeffs.tChar;
            if ('match' in tokenDeffs)
                tokenDeff.match = tokenDeffs.match;
            if ('open' in tokenDeffs)
                tokenDeff.open = tokenDeffs.open;
            if ('close' in tokenDeffs)
                tokenDeff.close = tokenDeffs.close;
            if ('lines' in tokenDeffs)
                tokenDeff.lines = tokenDeffs.lines;
            if ('ignore' in tokenDeffs)
                tokenDeff.ignore = tokenDeffs.ignore;
            if ('imp' in tokenDeffs)
                tokenDeff.imp = tokenDeffs.imp;
            else
                tokenDeff.imp = 0;

            this.tokenDeffs.push(tokenDeff);

            this.tokenDeffs.sort(function (a, b) {
                return b.imp - a.imp;
            });
        }
    } else {
        throw new TypeError('First arument must be of type \'Array\' or \'Object\'');
    }
};

Tokenizer.prototype.parse = function (data) {

    data = data.replace(/\r?\n|\n/g, '\n');

    data = data[data.length-1] === '\n' ? data : data + '\n';

    var _ = this,
        tokens = [],

    // indexers
        index  = 0,
        i      = 0,
        line   = 1,
        column = 1,
    // current token
        token,
        id,
        str,
        range,
    // current range
        sLine,
        eLine,
        sCol,
        eCol,
        sIndex,
        eIndex;

    function isEscaped(myIndex) {
        myIndex = myIndex || index;
        return data[myIndex] === '\\';
    }

    function nextChar() {
        index += 1;
        column += 1;
        if (/^\n$/.test(data[index])) {
            line += 1;
            column = 0;
        }
        return data[index];
    }

    function getMatchToken(tokenDeff) {
        var i,
            validToken,
            myIndex  = index,
            myLine   = line,
            myColumn = column,

            matchStr;

            str = data[myIndex];

        function myNextChar() {
            myIndex += 1;
            myColumn += 1;
            if (/^\n$/.test(data[myIndex])) {
                myLine += 1;
                myColumn = 0;
            }
            return data[myIndex];
        }

        if ('match' in tokenDeff && 'tChar' in tokenDeff) {
            sLine  = myLine;
            sCol   = myColumn;
            sIndex = myIndex;

            while (tokenDeff.tChar.test(data[myIndex + 1]) && myIndex < data.length) {
                str += myNextChar() || '';
            }

            if (tokenDeff.match.test(str)) {
                eLine  = myLine;
                eCol   = myColumn;
                eIndex = myIndex;

                range = Tokenizer.Range(sLine, eLine, sCol, eCol, sIndex, eIndex);

                index  = myIndex;
                line   = myLine;
                column = myColumn;

                validToken = true;
            }

        } else if ('open' in tokenDeff && 'close' in tokenDeff) {

            if (!(tokenDeff.open instanceof RegExp && tokenDeff.close instanceof RegExp)) return null;

            if (data.substr(myIndex).search(tokenDeff.open) === 0) {

                sLine  = myLine;
                sCol   = myColumn;
                sIndex = myIndex;

                matchStr = data.substr(myIndex).match(tokenDeff.open)[0];

                for (i = 1; i < matchStr.length; i++) {
                    str += myNextChar() || '';
                }
                if (tokenDeff.lines) {

                    while (myIndex < data.length) {
                        if (isEscaped(myIndex)) {
                        // escaped take both chars
                            str += myNextChar() || '';
                            str += myNextChar() || '';
                        } else if (data.substr(myIndex).search(tokenDeff.close) === 0 && sIndex !== myIndex) {
                            matchStr = data.substr(myIndex).match(tokenDeff.close)[0];
                            for (i = 1; i < matchStr.length; i++) {
                                str += myNextChar() || '';
                            }

                            if (tokenDeff.match) {
                                validToken = tokenDeff.match.test(str);
                            } else {
                                validToken = true;
                            }

                            break;
                        } else {
                            str += myNextChar() || '';
                        }
                    }

                } else {

                    while (myIndex < data.length && !(/^\n$/.test(data[myIndex]))) {
                        if (isEscaped(myIndex)) {
                        // escaped take both chars
                            str += myNextChar() || '';
                            str += myNextChar() || '';
                        } else if (data.substr(myIndex).search(tokenDeff.close) === 0 && sIndex !== myIndex) {
                            matchStr = data.substr(myIndex).match(tokenDeff.close)[0];
                            for (i = 1; i < matchStr.length; i++) {
                                str += myNextChar() || '';
                            }

                            if (tokenDeff.match) {
                                validToken = tokenDeff.match.test(str);
                            } else {
                                validToken = true;
                            }

                            break;
                        } else {
                            str += myNextChar() || '';
                        }
                    }
                }

                eLine  = myLine;
                eCol   = myColumn;
                eIndex = myIndex;

                range = Tokenizer.Range(sLine, eLine, sCol, eCol, sIndex, eIndex);
            }
        }

        if (validToken) {

            var ti=1;
            if (tokenDeff.pToken) {
                do {
                    if (tokenDeff.pToken.indexOf(tokens[tokens.length-ti] ? tokens[tokens.length-ti].id : 'SOF') !== -1) {
                        validToken = true;
                        break;
                    } else {
                        validToken = false;
                    }
                    ti++;
                } while(tokens[tokens.length-ti+1] && tokens[tokens.length-ti+1].id === "WHITESPACE");
            }

            if (validToken) {
                index  = myIndex;
                line   = myLine;
                column = myColumn;

                return Tokenizer.Token(tokenDeff.id, str, range, tokenDeff.ignore);
            }
        }

        return null;
    }

    while (index < data.length) {
        token = null;
        if (isEscaped()) {
            sLine  = line;
            sCol   = column;
            sIndex = index;

            str    = data[index] + nextChar();

            eLine  = line;
            eCol   = column;
            eIndex = index;

            range = Tokenizer.Range(sLine, eLine, sCol, eCol, sIndex, eIndex);

            token = Tokenizer.Token('ILLEGAL', str, range);
        } else {
            for (i = 0; i < _.tokenDeffs.length; i++) {
                if (_.tokenDeffs[i].sChar.test(data[index])) {
                    token = getMatchToken(_.tokenDeffs[i]);
                    if (token !== null) {
                        break;
                    }
                }
            }

            if (token === null) {

                sLine  = line;
                sCol   = column;
                sIndex = index;

                str    = data[index];

                eLine  = line;
                eCol   = column;
                eIndex = index;

                range = Tokenizer.Range(sLine, eLine, sCol, eCol, sIndex, eIndex);

                token = Tokenizer.Token('ILLEGAL', str, range);

            }
        }

        if (token.id==='ILLEGAL') throw new SyntaxError('Unexpected ILLEGAL token '+token.str+' at file.js:'+token.range.sLine+':'+token.range.sCol);

        tokens.push(token);
        nextChar();
    }

    range = Tokenizer.Range(0, line, 0, 0, 0, data.length);
    return Tokenizer.Tokens(range, tokens);
};

Tokenizer.prototype.stringify = function (object) {
    var str = '', i;
    if (!(object instanceof Tokenizer.Tokens))
        throw new TypeError('First arument must be of type \'Tokenizer.Tokens\'.');

    for (i = 0; i < object.tokens.length; i++) {
        str += object.tokens[i].str;
    }

    return str;
};

module.exports = Tokenizer;

},{}],14:[function(require,module,exports){
/**
 * @name generate.js
 * @author Michaelangelo Jong
 */

(function GeneratorScope() {

// Variables
var Creation = {},
    Generation = {},
    Generator = {};

// Helper Methods

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
        throw new TypeError('Expected \'' + type + '\' but instead found \'' + typeof test +'\'');
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
    var funcNameMatch = func.toString().match(/function\s*([^\s]*)\s*\(/);
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
        keys = Object.getOwnPropertyNames(obj).sort();
        length = keys.length;

        if ((length === 1 && (keys[0] === 'get' && typeof obj.get === 'function' ||
                              keys[0] === 'set' && typeof obj.set === 'function')) ||
            (length === 2 && (keys[0] === 'get' && typeof obj.get === 'function' &&
                              keys[1] === 'set' && typeof obj.set === 'function'))) {
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
        length;

    if (!descriptor || typeof descriptor !== 'object') {
        descriptor = {};
    }

    if (!properties || typeof properties !== 'object') {
        properties = descriptor;
        descriptor = {};
    }

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

// Creation Class
defineObjectProperties(
    Creation,
    {
        configurable: false,
        enumerable: false,
        writable: false
    },
    {
        /**
         * Defines properties on this object.
         * @param  {Object} descriptor Optional object descriptor that will be applied to all attaching properties.
         * @param  {Object} properties An object who's properties will be attached to this object.
         * @return {Object}            This object.
         */
        defineProperties: function defineProperties(descriptor, properties) {
            defineObjectProperties(this, descriptor, properties);
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
            return Object.getPrototypeOf(this.generator).proto;
            // return Object.getPrototypeOf(Object.getPrototypeOf(this));
        }
    }
);

// Generation Class
defineObjectProperties(
    Generation,
    {
        configurable: false,
        enumerable: false,
        writable: false
    },
    {
        name: 'Generation',

        proto: Creation,

        /**
         * Creates a new instance of this Generator.
         * @return {Generator} Instance of this Generator.
         */
        create: function create() {
            var _ = this,
                newObj = Object.create(_.proto);

            _.__supercreate(newObj, arguments);

            return newObj;
        },

        __supercreate: function __supercreate(newObj, args) {
            var _ = this,
                superGenerator = Object.getPrototypeOf(_),
                supercreateCalled = false;

            newObj.supercreate = function supercreate() {

                supercreateCalled = true;

                if (Generation.isGeneration(superGenerator)){
                    superGenerator.__supercreate(newObj, arguments);
                }
            };

            _.__create.apply(newObj, args);

            if (!supercreateCalled) {
                newObj.supercreate();
            }

            delete newObj.supercreate;
        },

        __create: function () {},

        /**
         * Generates a new generator that inherits from `this` generator.
         * @param {Generator} ParentGenerator Generator to inherit from.
         * @param {Function} create           Create method that gets called when creating a new instance of new generator.
         * @return {Generator}                New Generator that inherits from 'ParentGenerator'.
         */
        generate: function generate(create) {
            var _ = this;

            assertError(Generation.isGeneration(_) || _ === Generation, 'Cannot call method \'generate\' on non-Generations.');
            assertTypeError(create, 'function');

            var newGenerator = Object.create(_),
                newProto     = Object.create(_.proto);

            defineObjectProperties(
                newProto,
                {
                    configurable: false,
                    enumerable: false,
                    writable: false
                },
                {
                    generator: newGenerator
                }
            );

            defineObjectProperties(
                newGenerator,
                {
                    configurable: false,
                    enumerable: false,
                    writable: false
                },
                {
                    name: getFunctionName(create),
                    proto: newProto,
                    __create: create
                }
            );

            return newGenerator;
        },

        /**
         * Returns true if 'generator' was generated by this Generator.
         * @param  {Generator} generator A Generator.
         * @return {Boolean}             true or false.
         */
        isGeneration: function isGeneration(generator) {
            var _ = this;
            return _.isPrototypeOf(generator);
        },

        /**
         * Returns true if 'object' was created by this Generator.
         * @param  {Object} object An Object.
         * @return {Boolean}       true or false.
         */
        isCreation: function isCreation(object) {
            var _ = this;
            return _.proto.isPrototypeOf(object);
        },

        /**
         * Defines shared properties for all objects created by this generator.
         * @param  {Object} descriptor Optional object descriptor that will be applied to all attaching properties.
         * @param  {Object} properties An object who's properties will be attached to this generator's prototype.
         * @return {Generator}         This generator.
         */
        definePrototype: function definePrototype(descriptor, properties) {
            defineObjectProperties(this.proto, descriptor, properties);
            return this;
        },

        /**
         * Generator.toString method.
         * @return {String} A string representation of this generator.
         */
        toString: function toString() {
            return '[' + (this.name || 'generation') + ' Generator]';
        }
    }
);

// Generator Class Methods
defineObjectProperties(
    Generator,
    {
        configurable: false,
        enumerable: false,
        writable: false
    },
    {
        /**
         * Generates a new generator that inherits from `this` generator.
         * @param {Generator} ParentGenerator Generator to inherit from.
         * @param {Function} create           Create method that gets called when creating a new instance of new generator.
         * @return {Generator}                New Generator that inherits from 'ParentGenerator'.
         */
        generate: function generate (create) {
            return Generation.generate(create);
        },

        /**
         * Returns true if 'generator' was generated by this Generator.
         * @param  {Generator} generator A Generator.
         * @return {Boolean}             true or false.
         */
        isGenerator: function isGenerator (generator) {
            return Generation.isGeneration(generator);
        },

        /**
         * [toGenerator description]
         * @param  {Function} constructor A constructor function.
         * @return {Generator}            A new generator who's create method is `constructor` and inherits from `constructor.prototype`.
         */
        toGenerator: function toGenerator(constructor) {

            assertTypeError(constructor, 'function');

            var newGenerator = Object.create(Generation),
                newProto     = Object.create(constructor.prototype);

            defineObjectProperties(
                newProto,
                {
                    configurable: false,
                    enumerable: false,
                    writable: false
                },
                {
                    generator: newGenerator
                }
            );

            defineObjectProperties(
                newProto,
                {
                    configurable: false,
                    enumerable: false,
                    writable: false
                },
                Creation
            );

            defineObjectProperties(
                newGenerator,
                {
                    configurable: false,
                    enumerable: false,
                    writable: false
                },
                {
                    name: getFunctionName(constructor),
                    proto: newProto,
                    __create: constructor
                }
            );

            return newGenerator;
        }
    }
);

Object.freeze(Creation);
Object.freeze(Generation);
Object.freeze(Generator);

// Exports
if (typeof define === 'function' && define.amd) {
    // AMD
    define(function() {
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

},{}]},{},[1]);
