function CodeBuffer(str, file) {
    this.reset();
    this._buffer = str;
    this._file = file;
}

CodeBuffer.prototype = {
    reset: function reset() {
        this.line   = 1;
        this.column = 1;
        this._index = 0;
        this._currentLine = 0;
    },
    get currentLine() {
        var lineText = '',
            i = this._currentLine;

        while (i < this.length) {
            lineText += this._buffer[i];
            if (this._buffer.codePointAt(i) === 10) {
                break;
            }
            i++;
        }

        return lineText;
    },

    get buffer() {
        return this._buffer;
    },


    get index() {
        return this._index;
    },

    set index(val) {
        var i = this._index,
            update = false;

        val = Math.min(this.length, val);
        val = Math.max(0, val);

        if (i == val) return;

        if (i > val) {
            // throw new Error('========' + val + ' < ' +i+'=======');
            this.reset();
            i = this._index;
        }

        if (this.buffer.codePointAt(i) === 10) {
            update = true;
            i++;
        }

        for (; i <= val; i++) {
            if (update) {
                this._currentLine = i;
                this.line++;
                update = false;
            } else {
                this.column++;
            }

            if (this.buffer.codePointAt(i) === 10) {
                update = true;
            }
        }
        this.column = val - this._currentLine + 1;
        this._index = val;
    },

    get length() {
        return this._buffer.length;
    },

    next: function next() {
        this.index++;
        return this.charAt(this.index);
    },

    get left() {
        return this._index < this.length;
    },

    charAt: function charAt(i) {
        return this._buffer[i] || 'EOF';
    },

    codePointAt: function codePointAt(i) {
        return this._buffer.codePointAt(i);
    },

    slice: function slice(startIndex, endIndex) {
        return this._buffer.slice(startIndex, endIndex);
    },

    makeError: function makeError (message, tokenLength) {
        tokenLength = tokenLength || 1;

        var currentLine = this.currentLine,
            tokenIdentifier =
                currentLine[currentLine.length - 1] === '\n' ? '' : '\n',
            i;

        for (i = 1; i < this.column; i++) {
            tokenIdentifier += ' ';
        }

        tokenLength = Math.min(
            tokenLength,
            currentLine.length - tokenIdentifier.length
        ) || 1;

        for (i = 0; i < tokenLength; i++) {
            tokenIdentifier += '^';
        }

        return 'Syntax Error: ' +
            message +
            ' at ' +
            (this._file ? this._file + ':' : '') +
            this.line +
            ':' +
            this.column +
            ' index ' +
            this.index +
            '\n\n' +
            currentLine +
            tokenIdentifier +
            '\n' ;
    }
};

module.exports = CodeBuffer;
