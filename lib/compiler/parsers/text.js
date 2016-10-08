var TextToken = require('../tokens')
    .tokens.text,
    utils = require('../utils');

function parseText(mode, code, tokens, flags, scope,
    parseMode) {
    var index = code.index,
        isEntity = false,
        entityStr = '',
        value = '',
        textExitTag;

    if (mode === 'DOM') {
        for (; index < code.length; index++) {
            ch = code.codePointAt(index);

            if (
                ch === 0x003c /* < */ ||
                ch === 0x007b /* { */ &&
                code.codePointAt(index + 1) === 0x007b /* { */
            ) {
                value += entityStr;
                break;
            }

            if (ch === 0x0026 /* & */ ) {
                isEntity = true;
                entityStr = code.charAt(index);

                continue;
            } else if (isEntity && ch === 0x003b /* ; */ ) {
                entityStr += code.charAt(index);

                value += utils.getHTMLUnEscape(entityStr);

                isEntity = false;
                entityStr = '';

                continue;
            }

            if (isEntity && utils.isEntity(ch)) {
                entityStr += code.charAt(index);
            } else {
                value += entityStr;
                isEntity = false;
                entityStr = '';

                value += code.charAt(index);
            }
        }
    } else if (flags.whitepaceString) {
        for (; index < code.length; index++) {
            ch = code.codePointAt(index);

            /* \n */
            if (ch === 0x000a) {
                code.index = index;
                return null;
            }

            if ( /* " but not \" */
                ch === 0x0022 &&
                code.codePointAt(index - 1) !== 0x005c
            ) {
                break;
            }

            if ( /* {{ */
                ch === 0x007b &&
                code.codePointAt(index + 1) === 0x007b
            ) {
                break;
            }
        }
    } else {
        for (; index < code.length; index++) {
            if (
                code.codePointAt(index) === 0x007b /* { */ &&
                code.codePointAt(index + 1) === 0x007b /* { */
            ) {
                break;
            } else if (
                flags.textExitTag === 'script' &&
                /* </script> */
                code.codePointAt(index) === 0x003c &&
                code.codePointAt(index + 1) === 0x002f &&

                code.codePointAt(index + 2) === 0x0073 &&
                code.codePointAt(index + 3) === 0x0063 &&
                code.codePointAt(index + 4) === 0x0072 &&
                code.codePointAt(index + 5) === 0x0069 &&
                code.codePointAt(index + 6) === 0x0070 &&
                code.codePointAt(index + 7) === 0x0074 &&

                code.codePointAt(index + 8) === 0x003e
            ) {
                textExitTag = 9;
                break;
            } else if (
                flags.textExitTag === 'style' &&
                /* </style> */
                code.codePointAt(index) === 0x003c &&
                code.codePointAt(index + 1) === 0x002f &&

                code.codePointAt(index + 2) === 0x0073 &&
                code.codePointAt(index + 3) === 0x0074 &&
                code.codePointAt(index + 4) === 0x0079 &&
                code.codePointAt(index + 5) === 0x006c &&
                code.codePointAt(index + 6) === 0x0065 &&

                code.codePointAt(index + 7) === 0x003e
            ) {
                textExitTag = 8;
                break;
            }
        }
    }

    if (code.index < index) {
        var text = new TextToken(code);

        code.index = index;

        text.close();

        if (flags.minify) {
            text.value = utils.minifyHTMLText(value || text.source(code));
            if (/^\s*$/.test(text.value))
                return true;
        } else {
            text.value = value || text.source(code);
        }

        if (flags.textExitTag && textExitTag) {
            code.index += textExitTag;
            scope.close();
            parseMode.close();
        }

        return text;
    }

    return null;
}

module.exports = parseText;
