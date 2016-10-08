var Token = require('./token');

var OpperatorToken = Token.generate(
    function OpperatorToken(code) {
        var _ = this;

        if (code) {
            Token.call(_, code);
        }

        _.opperator = 0;

        _.arguments = [];
    }
);


OpperatorToken.definePrototype({
    enumerable: true
}, {
    type: 'opperator'
});

OpperatorToken.definePrototype({
    TYPE_ID: Token.tokens.push(OpperatorToken) - 1,
    toArray: function () {
        var _ = this;
        return [
            _.TYPE_ID,
            _.opperator,
            _.arguments
        ];
    },

    toObject: function () {
        var _ = this;
        return {
            type: _.type,
            TYPE_ID: _.TYPE_ID,
            opperator: _.opperator,
            arguments: _.arguments
        };
    },

    _fromArray: function _fromArray(arr) {
        var _ = this;

        _.opperator = arr[1];

        _.arguments = arr[2].map(function (item) {
            var arg = new Token.tokens[item[0]]();

            arg.fromArray(item);

            return arg;
        });
    },

    toString: function toString() {
        var _ = this,
            str = '';

        if (_.arguments.length === 1) {
            str += _.opperator + _.arguments[0].toString();
        } else if (_.arguments.length === 2) {
            str += _.arguments[0].toString();
            str += ' ' + _.opperator + ' ';
            str += _.arguments[1].toString();
        }

        return str;
    }
});

Token.tokens.opperator = OpperatorToken;
Token;
