var TYPES = require('../compiler/token-types');
var logic = require('./logic');

function execute(syntaxTree, transforms, context) {
    function run(token) {
        var result,
            args =  [];

        if (
            token.type === TYPES.STRING ||
            token.type === TYPES.NUMBER ||
            token.type === TYPES.BOOLEAN ||
            token.type === TYPES.NULL
        ) {
            result = token.value;
        } else if (
            token.type === TYPES.INSERT_VAL
        ) {
            result = context.lookup(token.path);
        } else if (
            token.type === TYPES.UNARY_EXPRESSION
        ) {
            result = logic[token.opperator](
                run(token.argument)
            );
        } else if (
            token.type === TYPES.BINARY_EXPRESSION
        ) {
            if (token.opperator === '||') {
                result = run(token.left) || run(token.right);
            } else if (token.opperator === '&&') {
                result = run(token.left) && run(token.right);
            } else {
                result = logic[token.opperator](
                    run(token.left),
                    run(token.right)
                );
            }
        } else if (
            token.type === TYPES.TRANSFORM
        ) {
            for (var i = 0; i < token.arguments.length; i++) {
                args.push(run(token.arguments[i]));
            }
            if (transforms[token.name] instanceof Function) {
                result = transforms[token.name].apply(null, args);
            } else {
                throw 'Missing Transfrom: "' + token.name +'".';
            }
        }

        return result;
    }

    if (syntaxTree) {
        return run(syntaxTree);
    } else {
        return context.lookup('.');
    }
}

module.exports = execute;
