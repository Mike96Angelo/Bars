// parseHTMLAttr
var Token = require('../tokens'),
    AttrToken = Token.tokens.attr,
    PropToken = Token.tokens.prop,
    BindToken = Token.tokens.bind,
    utils = require('../utils');

function parseHTMLAttr(mode, code, tokens, flags, scope, parseMode) {
    var index = code.index,
        length = code.length;

    if (!utils.isHTMLIdentifierStart(code.codePointAt(index))) {
        return null;
    }

    var attr = new AttrToken(code);
    var prop = new PropToken(code);
    var bind = new BindToken(code);

    for (; index < length; index++) {

        if (!utils.isHTMLIdentifier(code.codePointAt(index))) {
            break;
        }

        attr.name += code.charAt(index);
    }

    bind.name = prop.name = attr.name;

    if (attr.name) {
        /* = */
        if (code.codePointAt(index) === 0x003d) {
            index++;
            /* " */
            if (code.codePointAt(index) === 0x0022) {
                index++;
                code.index = index;

                scope.push(attr);
                flags.whitepaceString = true;
                parseMode('VALUE', attr.nodes, flags);
                delete flags.whitepaceString;
            } else {
                throw code.makeError(
                    index, index + 1,
                    'Unexpected Token: Expected "\"" but found ' +
                    JSON.stringify(code.charAt(index))
                );
            }
        } else if (code.codePointAt(index) === 0x003a) { /* : */
            index++;
            if (code.codePointAt(index) === 0x003a) { /* : */
                index++;
                bind = prop;
            }
            if ( /* {{ */
                code.codePointAt(index) === 0x007b &&
                code.codePointAt(index + 1) === 0x007b
            ) {
                var args = [];
                code.index = index + 2;
                scope.push(bind);
                parseMode('LOGIC-EXP', args, flags);

                args = utils.makeExpressionTree(args, code);

                if (args.length > 1) {
                    code.index = args[1].range[0];
                    throw code.makeError(
                        args[1].range[0], args[1].range[1],
                        'Unexpected Token: ' +
                        JSON.stringify(args[1].source(code)) + '.'
                    );
                }

                bind.expression = args[0];

                args = null;

                if (!bind.closed) {
                    throw code.makeError(
                        code.index, code.index + 1,
                        'Unclosed Block: Expected ' +
                        JSON.stringify('}}') +
                        ' but found ' +
                        JSON.stringify(code.charAt(code.index)) +
                        '.'
                    );
                }

                if (!bind.expression) {
                    throw code.makeError(
                        code.index - 2, code.index - 1,
                        'Missing <expression>.'
                    );
                }

                return bind;

            } else {
                throw code.makeError(
                    index - 1, index,
                    'Unexpected Token: :'
                );
            }
        } else {
            code.index = index;
            attr.close();
        }

        if (!attr.closed) {
            throw code.makeError(
                attr.range[0] + attr.name.length + 1,
                attr.range[0] + attr.name.length + 2,
                'Unclosed String: Expected "\"" to fallow "\""'
            );
        }

        if (scope.token && attr.nodesUpdate) {
            scope.token.updates('attr');
        }

        return attr;
    }

    return null;
}

module.exports = parseHTMLAttr;
