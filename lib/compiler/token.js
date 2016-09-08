
function Token(code, type) {

    this.type = type;
    this.range = [code.index, code.index + 1];
    this.loc = {
        start: {
            line: code.line,
            column: code.column
        },
        end: {
            line: code.line,
            column: code.column + 1
        }
    };
    // console.log('TOKEN: '+this.type.red+' `' + this.source(code).green.underline+'` at ' + this.loc.start.line+ ':' + this.loc.start.column);
}

Token.prototype = {
    get length() {
        return this.range[1] - this.range[0];
    },
    source: function source(code) {
        return code.slice(this.range[0], this.range[1]);
    },
    close: function close(code) {
        this.closed = true;

        if (code.index > this.range[1]) {
            this.range[1] = code.index;
            // this.value = code.slice(this.range[0], this.range[1]);
            this.loc.end = {
                line: code.line,
                column: code.column
            };
        }

        // console.log('TOKEN: '+this.type.red+' `' + this.source(code).green.underline+'` at ' + this.loc.start.line+ ':' + this.loc.start.column);
    },
    // toJSON: function toJSON() {
    //     return {
    //         type: this.type,
    //         value: this.value,
    //         range: this.range,
    //         loc: this.loc,
    //     };
    // },
    toJSON: function toJSON() {
        delete this.range;
        delete this.loc;
        delete this.closed;
        return this;
    }
};

module.exports = Token;
