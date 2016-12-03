var Token = require('../tokens'),
    BlockToken = Token.tokens.block,
    FragmentToken = Token.tokens.fragment,
    utils = require('../utils');

function parseBarsBlock(mode, code, tokens, flags, scope, parseMode) {
    var index = code.index + 2,
        length = code.length,
        block,
        isOpening,
        isClosing,
        isElse,
        alternateIsBlock,
        blockMode = flags.markup.mode;

    if ( /* / */
        code.codePointAt(index) === 0x002f
    ) {
        isClosing = true;
        flags.markup.closeParseScope = true;
    } else if ( /* # */
        code.codePointAt(index) === 0x0023 ||
        (scope.token && scope.token.alternateIsBlock)
    ) {
        isOpening = true;
    } else if ( /* else */
        code.codePointAt(index) === 0x0065 &&
        code.codePointAt(++index) === 0x006c &&
        code.codePointAt(++index) === 0x0073 &&
        code.codePointAt(++index) === 0x0065
    ) {
        isElse = true;
        if (utils.isWhitespace(code.codePointAt(index + 1))) {
            index += 2;

            alternateIsBlock = true;
        } else if (
            code.codePointAt(++index) === 0x007d &&
            code.codePointAt(++index) === 0x007d
        ) {
            index++;
        }

        block = new BlockToken(code);
        code.index = index;
        block.close();

        if (!BlockToken.isCreation(scope.token) || scope.token.elsed) {
            throw code.makeError(
                block.range[0], block.range[1],
                'Unexpected Token: ' +
                JSON.stringify(block.source(code)) +
                '.'
            );
        }

        scope.token.elsed = true;

        scope.token.alternateIsBlock = alternateIsBlock;
        flags.markup.closeParseScope = true;

        scope.close();
        parseMode.close();

        return true;
    } else {
        return null;
    }

    if (scope.token && scope.token.alternateIsBlock) {
        index -= 2;
    } else
        index++;
    block = new BlockToken(code);

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
            block.name += code.charAt(index);
        } else {
            break;
        }
    }

    if (isClosing) {
        if (
            code.codePointAt(index) === 0x007d &&
            code.codePointAt(++index) === 0x007d
        ) {
            index++;
        } else {
            throw code.makeError(
                index, index + 1,
                'Unexpected Token: Expected ' +
                JSON.stringify('}}') +
                ' but found ' +
                JSON.stringify(code.charAt(index)) +
                '.'
            );
        }

        code.index = index;
        block.close();

        if (!BlockToken.isCreation(scope.token)) {
            throw code.makeError(
                block.range[0], block.range[1],
                'Unexpected Closing Block: ' +
                JSON.stringify(block.source(code)) +
                '.'
            );
        }

        if (scope.token.name !== block.name) {
            throw code.makeError(
                block.range[0], block.range[1],
                'Mismatch Closing Block: Expected ' +
                JSON.stringify('{{/' + scope.token.name + '}}') +
                ' but found ' +
                JSON.stringify(block.source(code)) +
                '.'
            );
        }

        scope.close();

        parseMode.close();

        return true;
    }

    if (utils.isWhitespace(code.codePointAt(index)))
        index++;

    code.index = index;

    var args = [];

    scope.push(block);

    parseMode('LOGIC', args, flags);

    args = utils.makeExpressionTree(args, code);

    block.expression = args[0];

    if (args.length > 1) {
        throw code.makeError(
            args[1].range[0], args[1].range[1],
            'Unexpected Token: ' +
            JSON.stringify(args[1].source(code)) + '.'
        );
    }

    args = null;

    if (!block.closed) {
        throw code.makeError(
            code.index, code.index + 1,
            'Unclosed Block: Expected ' +
            JSON.stringify('}}') +
            ' but found ' +
            JSON.stringify(code.charAt(code.index)) +
            '.'
        );
    }

    if (!block.expression) {
        throw code.makeError(
            code.index - 2, code.index - 1,
            'Missing <expression>.'
        );
    }

    block.consequent = new FragmentToken(code);

    delete block.closed;
    scope.push(block);

    parseMode(blockMode, block.consequent.nodes, flags);

    index = code.index;

    block.consequent.close();

    code.index = index;

    if (block.elsed) {
        if (block.alternateIsBlock) {
            delete block.closed;
            scope.push(block);

            flags.markup = {
                mode: blockMode
            };
            block.alternate = parseBarsBlock(mode, code, [], flags, scope,
                parseMode);

            delete flags.markup;

            scope.close();

            return block;
        }

        block.alternate = new FragmentToken(code);

        delete block.closed;
        scope.push(block);

        parseMode(blockMode, block.alternate.nodes, flags);

        index = code.index;

        block.alternate.close();
    }

    if (!block.closed) {
        throw code.makeError(
            block.range[0], block.range[0] + block.name.length + 6 +
            block.expression.length,
            'Unclosed Block: Expected ' +
            JSON.stringify('{{/' + block.name + '}}') +
            ' to fallow ' +
            JSON.stringify('{{#' + block.name + ' <expression>}}') +
            '.'
        );
    }

    parseMode.close();

    return block;
}

module.exports = parseBarsBlock;
