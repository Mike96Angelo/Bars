var PartialToken = require('../tokens')
    .tokens.partial,
    utils = require('../utils');

function parseBarsPartial(mode, code, tokens, flags, scope, parseMode) {
    var index = code.index + 2,
        length = code.length,
        partial;

    if ( /* > */
        code.codePointAt(index) === 0x003e
    ) {
        partial = new PartialToken(code);

        index++;

        if (!utils.isHTMLIdentifierStart(code.codePointAt(index))) {
            throw code.makeError(
                index, index + 1,
                'Unexpected Token: Expected <[A-Za-z]> but found ' +
                JSON.stringify(code.charAt(index)) +
                '.'
            );
        }

        for (; index < length; index++) {
            ch = code.codePointAt(index);

            if (utils.isHTMLIdentifier(ch)) {
                partial.name += code.charAt(index);
            } else {
                break;
            }
        }

        code.index = index;


        var args = [];

        scope.push(partial);
        parseMode('LOGIC', args, flags);

        if (args.length > 1) {
            throw code.makeError(
                args[1].range[0], args[1].range[1],
                'Unexpected Token: ' +
                JSON.stringify(args[1].source(code)) + '.'
            );
        }

        partial.expression = args[0] || null;

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

        // if (!partial.argument) {
        //     code.index -= 2;
        //     throw code.makeError('Missing <arg>.');
        // }

        parseMode.close();
        return partial;
    }

    return null;
}

module.exports = parseBarsPartial;
