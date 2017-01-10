var PartialToken = require('../tokens')
    .tokens.partial,
    utils = require('../utils');

function parseBarsPartial(mode, code, tokens, flags, scope, parseMode) {
    var index = code.index + 2,
        length = code.length,
        partial,
        router = false;

    if ( /* > */
        code.codePointAt(index) === 0x003e
    ) {
        partial = new PartialToken(code);

        index++;

        if (code.codePointAt(index) === 0x003f) {
            router = true;
            index++;
        } else if (utils.isHTMLIdentifierStart(code.codePointAt(index))) {
            for (; index < length; index++) {
                ch = code.codePointAt(index);

                if (utils.isHTMLIdentifier(ch)) {
                    partial.name += code.charAt(index);
                } else {
                    break;
                }
            }
        } else {
            throw code.makeError(
                index, index + 1,
                'Unexpected Token: Expected <[A-Za-z]> but found ' +
                JSON.stringify(code.charAt(index)) +
                '.'
            );
        }

        code.index = index;

        var args = [];

        scope.push(partial);
        parseMode('LOGIC', args, flags);

        args = utils.makeExpressionTree(args, code);

        var am = utils.sortArgsAndContextMap(args, code);
        args = am.args;
        partial.map = am.map;

        am = null;

        if (args.length > (router ? 2 : 1)) {
            throw code.makeError(
                args[1].range[0], args[1].range[1],
                'Unexpected Token: ' +
                JSON.stringify(args[1].source(code)) + '.'
            );
        }

        if (router) {
            partial.name = args[0] || null;
            partial.expression = args[1] || null;
        } else {
            partial.expression = args[0] || null;
        }

        args = null;

        if (!partial.closed) {
            throw code.makeError(
                index, index + 1,
                'Unclosed Block: Expected ' +
                JSON.stringify('}}') +
                ' but found ' +
                JSON.stringify(code.charAt(code.index)) +
                '.'
            );
        }

        parseMode.close();
        return partial;
    }

    return null;
}

module.exports = parseBarsPartial;
