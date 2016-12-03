var Token = require('../tokens'),
    TransformToken = Token.tokens.transform,
    OperatorToken = Token.tokens.operator,
    utils = require('../utils');

function parseExpressionTransform(mode, code, tokens, flags, scope, parseMode) {
    var index = code.index,
        length = code.length,
        transform,
        ch = code.codePointAt(index);

    if (ch !== 0x0040) { /* @ */
        return null;
    }

    index++;

    if (!utils.isHTMLIdentifierStart(code.codePointAt(index))) {
        return null;
    }

    transform = new TransformToken(code);

    for (; index < length; index++) {
        ch = code.codePointAt(index);

        if (utils.isHTMLIdentifier(ch)) {
            transform.name += code.charAt(index);
        } else {
            break;
        }
    }

    ch = code.codePointAt(index);
    if (ch === 0x0028) { /* ( */
        index++;
        code.index = index;

        scope.push(transform);

        while (code.left) {
            var args = [];


            parseMode('LOGIC-ARGS', args, flags);

            args = utils.makeExpressionTree(args, code);

            if (args.length > 1) {
                code.index = args[1].range[0];
                throw code.makeError(
                    args[1].range[0], args[1].range[1],
                    'Unexpected Token: ' +
                    JSON.stringify(args[1].source(code)) + '.'
                );
            }

            transform.arguments.push(args[0]);

            if (transform.nextArg) {
                delete transform.nextArg;
                delete transform.closed;
            }

            if (transform.closed) {
                break;
            }
        }
    } else {
        return null;
    }

    var preToken = tokens[tokens.length - 1];
    if (preToken && !OperatorToken.isCreation(preToken)) {
        throw code.makeError(
            number.range[0],
            number.range[1],
            'Unexpected token: ' +
            JSON.stringify(
                number.source()
            )
            .slice(1, -1)
        );
    }

    return transform;
}

module.exports = parseExpressionTransform;
