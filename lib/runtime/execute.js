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
            token.type === 'opperator' &&
            token.arguments.length === 1
        ) {
            result = logic[token.opperator](
                run(token.arguments[0])
            );
        } else if (
            token.type === 'opperator' &&
            token.arguments.length === 2
        ) {
            if (token.opperator === '||') {
                result = run(token.arguments[0]) || run(token.arguments[1]);
            } else if (token.opperator === '&&') {
                result = run(token.arguments[0]) && run(token.arguments[1]);
            } else {
                result = logic[token.opperator](
                    run(token.arguments[0]),
                    run(token.arguments[1])
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
