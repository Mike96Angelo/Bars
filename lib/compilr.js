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
