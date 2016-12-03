var InsertToken = require('../tokens')
    .tokens.insert,
    utils = require('../utils');

function parseBarsInsert(mode, code, tokens, flags, scope, parseMode) {
    var index = code.index + 2,
        length = code.length,
        insert = new InsertToken(code),
        args = [];

    scope.push(insert);
    code.index = index;

    parseMode('LOGIC', args, flags);

    args = utils.makeExpressionTree(args, code);

    if (args.length > 1) {
        code.index = args[1].range[0];
        throw code.makeError(
            args[1].range[0], args[1].range[1],
            'Unexpected Token: ' +
            JSON.stringify(args[1].source(code)) + '.'
        );
    }

    insert.expression = args[0];

    args = null;

    if (!insert.closed) {
        throw code.makeError(
            code.index, code.index + 1,
            'Unclosed Block: Expected ' +
            JSON.stringify('}}') +
            ' but found ' +
            JSON.stringify(code.charAt(code.index)) +
            '.'
        );
    }

    if (!insert.expression) {
        throw code.makeError(
            code.index - 2, code.index - 1,
            'Missing <expression>.'
        );
    }

    parseMode.close();
    return insert;
}


module.exports = parseBarsInsert;
