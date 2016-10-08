//parseBarsComment

function parseBarsComment(mode, code, tokens, flags, scope, parseMode) {
    var index = code.index + 2,
        length = code.length;

    if ( /* ! */
        code.codePointAt(index) === 0x0021
    ) {
        if (
            code.codePointAt(++index) === 0x002d &&
            code.codePointAt(++index) === 0x002d
        ) {
            index++;

            for (; index < length; index++) {
                if ( /* --}} */
                    code.codePointAt(index) === 0x002d &&
                    code.codePointAt(index + 1) === 0x002d &&
                    code.codePointAt(index + 2) === 0x007d &&
                    code.codePointAt(index + 3) === 0x007d
                ) {
                    index += 4; /* for --}} */
                    code.index = index;

                    parseMode.close();

                    if (flags.keepComments) {
                        // make a CommentToken and return that.
                    }

                    return true;
                }
            }

            throw code.makeError(
                'Unclosed Comment: Expected "--}}" to fallow "{{!--".',
                5
            );
        }

        index++;

        for (; index < length; index++) {

            if ( /* }} */
                code.codePointAt(index) === 0x007d &&
                code.codePointAt(index + 1) === 0x007d
            ) {
                index += 2; /* for }} */
                code.index = index;

                parseMode.close();

                if (flags.keepComments) {
                    // make a CommentToken and return that.
                }

                return true;
            }
        }

        throw code.makeError(
            code.index, code.index + 3,
            'Unclosed Comment: Expected "}}" to fallow "{{!".'
        );
    }

    return null;
}

module.exports = parseBarsComment;
