//parseHTMLComment

function parseHTMLComment(mode, code, tokens, flags, scope, parseMode) {
    var index = code.index,
        length = code.length;

    if ( /* <!-- */
        code.codePointAt(index) === 0x003c &&
        code.codePointAt(++index) === 0x0021 &&
        code.codePointAt(++index) === 0x002d &&
        code.codePointAt(++index) === 0x002d
    ) {
        index++;

        for (; index < length; index++) {
            if ( /* --> */
                code.codePointAt(index) === 0x002d &&
                code.codePointAt(index + 1) === 0x002d &&
                code.codePointAt(index + 2) === 0x003e
            ) {
                index += 3;
                code.index = index;

                return true;
            }
        }

        throw code.makeError(
            code.index, code.index + 4,
            'Unclosed Comment: Expected "-->" to fallow "<!--".'
        );
    }

    return null;
}

module.exports = parseHTMLComment;
