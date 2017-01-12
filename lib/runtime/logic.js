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
