var Token = require('./token');

// program
require('./program');
require('./fragment');

// html markup
require('./text');
require('./tag');
require('./attr');
require('./prop');
require('./bind');

// bars markup
require('./block');
require('./insert');
require('./partial');

// bars expression
require('./literal');
require('./value');
require('./transform');
require('./operator');

// as expression
require('./as');

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
