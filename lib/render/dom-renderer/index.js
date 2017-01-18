var NODES = require('./nodes');

require('./block-node');
require('./partial-node');
require('./fragment-node');
require('./tag-node');
require('./attr-node');
require('./text-node');

module.exports = NODES;
