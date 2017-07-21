var ComponentToken = require('../tokens')
    .tokens.component,
    utils = require('../utils');

function parseBarsComponent(mode, code, tokens, flags, scope, parseMode) {
    var index = code.index + 2,
        length = code.length,
        component,
        router = false;

    if ( /* $ */
        code.codePointAt(index) === 0x0024
    ) {
        component = new ComponentToken(code);

        index++;

        if (code.codePointAt(index) === 0x003f) {
            router = true;
            index++;
        } else if (utils.isHTMLIdentifierStart(code.codePointAt(index))) {
            for (; index < length; index++) {
                ch = code.codePointAt(index);

                if (utils.isHTMLIdentifier(ch)) {
                    component.name += code.charAt(index);
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

        scope.push(component);

        parseMode('LOGIC', args, flags);

        args = utils.makeExpressionTree(args, code);

        var am = utils.sortArgsAndContextMap(args, code);
        args = am.args;
        component.map = am.map;

        if (am.as) {
            throw code.makeError(
                am.as.range[0], am.as.range[1],
                'Unexpected Token: ' +
                JSON.stringify(am.as.source(code)) + '.'
            );
        }

        am = null;

        if (args.length > (router ? 2 : 1)) {
            throw code.makeError(
                args[1].range[0], args[1].range[1],
                'Unexpected Token: ' +
                JSON.stringify(args[1].source(code)) + '.'
            );
        }

        if (router) {
            component.name = args[0] || null;
            component.expression = args[1] || null;
        } else {
            component.expression = args[0] || null;
        }

        args = null;

        if (!component.closed) {
            throw code.makeError(
                index, index + 1,
                'Unclosed Component: Expected ' +
                JSON.stringify('}}') +
                ' but found ' +
                JSON.stringify(code.charAt(code.index)) +
                '.'
            );
        }

        parseMode.close();
        return component;
    }

    return null;
}

module.exports = parseBarsComponent;
