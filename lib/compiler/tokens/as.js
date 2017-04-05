var Token = require('./token');

var AsToken = Token.generate(
    function AsToken(code) {
        var _ = this;

        if (code) {
            Token.call(_, code);
        }

        _.vars = [];
    }
);


AsToken.definePrototype({
    enumerable: true
}, {
    type: 'as'
});

AsToken.definePrototype({
    TYPE_ID: Token.tokens.push(AsToken) - 1,
    toArray: function () {
        var _ = this;
        return [
            _.TYPE_ID,
            _.name,
            _.vars
        ];
    },

    toObject: function () {
        var _ = this;
        return {
            type: _.type,
            TYPE_ID: _.TYPE_ID,
            name: _.name,
            vars: _.vars
        };
    },

    _fromArray: function _fromArray(arr) {
        var _ = this;

        _.vars = arr[2].map(function (item) {
            var arg = new Token.tokens[item[0]]();

            arg.fromArray(item);

            return arg;
        });
    },

    toString: function toString() {
        var _ = this,
            str = ' as | ';

        for (var i = 0; i < _.vars.length; i++) {

            str += _.vars[i].toString();
        }

        str += ' | ';

        return str;
    }
});

Token.tokens.as = AsToken;
