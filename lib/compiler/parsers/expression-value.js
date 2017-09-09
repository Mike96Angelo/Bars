var Token = require('../tokens'),
  ValueToken = Token.tokens.value,
  OperatorToken = Token.tokens.operator,
  utils = require('../utils');

function parseExpressionValue(mode, code, tokens, flags, scope, parseMode) {
  var index = code.index,
    length = code.length,
    ch = code.codePointAt(index),
    prop = ch === 0x0040,
    start = ch === 0x0024 || ch === 0x005f;

  if (prop && flags.asExpression) {
    return null;
  }

  if (!utils.isHTMLIdentifierStart(ch) &&
    !start &&
    !prop
  ) {
    return null;
  }

  value = new ValueToken(code);

  value.path = [];

  if (prop) {
    value.path.push('@');
    index++;
  }

  var name = '';

  for (; index < length; index++) {
    ch = code.codePointAt(index);

    if (utils.isHTMLIdentifier(ch)) {
      name += code.charAt(index);
    } else {
      break;
    }
  }

  if (!name) {
    throw code.makeError(
      value.range[0], value.range[1],
      'Unexpected Token: ' +
      JSON.stringify(value.source())
      .slice(1, -1)
    );
  }

  value.path.push(name);
  code.index = index;
  value.close();

  return value;
}

module.exports = parseExpressionValue;
