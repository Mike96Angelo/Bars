var Token = require('./token');

var BlockToken = Token.generate(
    function BlockToken(code) {
        var _ = this;

        if (code) {
            Token.call(_, code);
        }

        _.name = '';

        _.arguments = null;
        _.map = null;

        _.consequent = null;
        _.alternate = null;
    }
);


BlockToken.definePrototype({
    enumerable: true
}, {
    type: 'block'
});

BlockToken.definePrototype({
    TYPE_ID: Token.tokens.push(BlockToken) - 1,
    toArray: function () {
        var _ = this;
        return [
            _.TYPE_ID,
            _.name,
            _.arguments,
            _.map,
            _.consequent,
            _.alternate
        ];
    },

    toObject: function () {
        var _ = this;
        return {
            type: _.type,
            TYPE_ID: _.TYPE_ID,
            name: _.name,
            arguments: _.arguments,
            map: _.map,
            consequent: _.consequent,
            alternate: _.alternate
        };
    },

    _fromArray: function _fromArray(arr) {
        var _ = this;

        _.name = arr[1];

        _.arguments = arr[2].map(function (item) {
            var arg = new Token.tokens[item[0]]();

            arg.fromArray(item);

            return arg;
        });

        _.map = arr[3].map(function (item) {
            var arg = new Token.tokens[item[0]]();

            arg.fromArray(item);

            return arg;
        });

        var consequent = new Token.tokens.fragment();

        consequent.fromArray(arr[4]);

        _.consequent = consequent;

        if (arr[5]) {
            var alternate = new Token.tokens[arr[5][0]]();

            alternate.fromArray(arr[5]);

            _.alternate = alternate;
        }
    },

    toString: function toString() {
        var _ = this,
            str = '';

        if (!_.fromElse) {
            str += _.indentLevel + '{{#';
        }

        str += _.name + ' ';

        str += _.expression.toString();
        str += (_.map ? _.map.toString() : '');

        str += '}}';

        _.consequent.indentLevel = (_.indentLevel ? _.indentLevel +
            '  ' : '');
        str += _.consequent.toString();

        if (_.alternate) {
            _.alternate.indentLevel = _.indentLevel;
            if (_.alternate.type === 'block') {
                _.alternate.fromElse = true;
                str += _.indentLevel + '{{else ' + _.alternate.toString();
                return str;
            }
            _.alternate.indentLevel += (_.indentLevel ? _.indentLevel +
                '  ' : '');

            str += _.indentLevel + '{{else}}';
            str += _.alternate.toString();
        }

        str += _.indentLevel + '{{/' + _.name + '}}';

        return str;
    },
    updates: function updates() {
        var _ = this;

        if (_.elsed && _.alternate) {
            _.alternate.nodesUpdate = 1;
        } else if (_.consequent) {
            _.consequent.nodesUpdate = 1;
        }
    }
});

Token.tokens.block = BlockToken;
