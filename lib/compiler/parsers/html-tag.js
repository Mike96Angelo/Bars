var Token = require('../tokens'),
    TagToken = Token.tokens.tag,
    AttrToken = Token.tokens.attr,
    PropToken = Token.tokens.prop,
    BindToken = Token.tokens.bind,
    utils = require('../utils');


function parseHTMLTag(mode, code, tokens, flags, scope, parseMode) {
    var index = code.index,
        length = code.length,
        tag,
        isClosing;
    if ( /* < */
        code.codePointAt(index) === 0x003c
    ) {
        if ( /* / */
            code.codePointAt(index + 1) === 0x002f
        ) {
            isClosing = true;
            index++;
        }

        tag = new TagToken(code);

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
                tag.name += code.charAt(index);
            } else {
                break;
            }
        }

        code.index = index;

        if (isClosing) {
            if (ch !== 0x003e) { /* > */
                throw code.makeError(
                    index, index + 1,
                    'Unexpected Token: Expected ' +
                    JSON.stringify('>') +
                    ' but found ' +
                    JSON.stringify(code.charAt(index)) +
                    '.'
                );
            }

            index++;

            code.index = index;
            tag.close();

            if (!TagToken.isCreation(scope.token)) {
                throw code.makeError(
                    tag.range[0], tag.range[1],
                    'Unexpected Closing Tag: ' +
                    JSON.stringify(tag.source(code)) +
                    '.'
                );
            }

            if (scope.token.name !== tag.name) {
                throw code.makeError(
                    tag.range[0], tag.range[1],
                    'Mismatch Closing Tag: Expected ' +
                    JSON.stringify('</' + scope.token.name + '>') +
                    ' but found ' +
                    JSON.stringify(tag.source(code)) +
                    '.'
                );
            }

            scope.close();
            parseMode.close();

            return true;
        }

        var attrsAndProps = [];

        scope.push(tag);
        parseMode('ATTR', attrsAndProps, flags);

        tag.attrs = attrsAndProps.filter(function (token) {
            return AttrToken.isCreation(token);
        });

        tag.props = attrsAndProps.filter(function (token) {
            return PropToken.isCreation(token);
        });

        tag.binds = attrsAndProps.filter(function (token) {
            return BindToken.isCreation(token);
        });

        attrsAndProps = null;

        if (!tag.closed) {
            throw code.makeError(
                index, index + 1,
                'Unclosed Tag: Expected ' +
                JSON.stringify('>') +
                ' but found ' +
                JSON.stringify(code.charAt(code.index)) +
                '.'
            );
        }

        if (utils.isSelfClosing(tag.name)) {
            tag.selfClosing = true;
        }

        if (tag.selfClosing || tag.selfClosed) {
            return tag;
        }

        delete tag.closed;

        if (tag.name === 'pre' || tag.name === 'style' || tag.name ===
            'script') {
            flags.minify = false;
        }

        scope.push(tag);

        if (tag.name === 'style' || tag.name === 'script') {
            flags.textExitTag = tag.name;
            parseMode('TEXT', tag.nodes, flags);
            delete flags.textExitTag;
        } else {
            parseMode(mode, tag.nodes, flags);
        }

        if (!tag.closed) {
            throw code.makeError(
                tag.range[0], tag.range[1],
                'Unclosed Tag: Expected ' +
                JSON.stringify('</' + tag.name + '>') +
                ' to fallow ' +
                JSON.stringify(tag.source(code)) +
                '.'
            );
        }

        if (scope.token && (tag.attrsUpdate || tag.nodesUpdate)) {
            scope.token.updates();
        }

        return tag;
    }

    return null;
}


module.exports = parseHTMLTag;
