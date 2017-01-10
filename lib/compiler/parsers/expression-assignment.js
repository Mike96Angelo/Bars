var Token = require('../tokens'),
    ValueToken = Token.tokens.value,
    AssignmentToken = Token.tokens.assignment;

function isEQ(ch) {
    return ch === 0x003d;
}

function parseAssignment(mode, code, tokens, flags, scope, parseMode) {
    var index = code.index,
        length = code.length;

    if (!isEQ(code.codePointAt(index))) {
        return null;
    }

    var assignment = new AssignmentToken(code);

    code.index++;

    assignment.close();

    var preToken = tokens[tokens.length - 1];

    if (!ValueToken.isCreation(preToken)) {
        throw code.makeError(
            assignment.range[0],
            assignment.range[1],
            'Unexpected Token: ' +
            JSON.stringify(
                assignment.source()
            )
            .slice(1, -1)
        );

    }

    return assignment;
}

module.exports = parseAssignment;
