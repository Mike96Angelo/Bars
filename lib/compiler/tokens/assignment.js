var Token = require('./token');

var AssignmentToken = Token.generate(
    function AssignmentToken(code) {
        var _ = this;

        if (code) {
            Token.call(_, code);
        }

        _.name = '';

        _.expression = null;
    }
);


AssignmentToken.definePrototype({
    enumerable: true
}, {
    type: 'assignment'
});

AssignmentToken.definePrototype({
    TYPE_ID: Token.tokens.push(AssignmentToken) - 1,
    toArray: function () {
        var _ = this;
        return [
            _.TYPE_ID,
            _.name,
            _.expression
        ];
    },

    toObject: function () {
        var _ = this;
        return {
            type: _.type,
            TYPE_ID: _.TYPE_ID,
            name: _.name,
            expression: _.expression
        };
    },

    _fromArray: function _fromArray(arr) {
        var _ = this;

        _.name = arr[1];

        _.expression = new Token.tokens[arr[2][0]]();

        _.expression.fromArray(arr[2]);
    },

    toString: function toString() {
        // var _ = this,
        //     str = '';
        //
        // if (_.operands.length === 1) {
        //     str += _.assignment + _.operands[0].toString();
        // } else if (_.operands.length === 2) {
        //     str += _.operands[0].toString();
        //     str += ' ' + _.assignment + ' ';
        //     str += _.operands[1].toString();
        // }
        //
        // return str;
    }
});

Token.tokens.assignment = AssignmentToken;
