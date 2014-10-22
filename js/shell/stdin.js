// Stdin the standard-input interface for reading lines from the shell
SH.Stdin = function () {
    this.line;
    this.fn;
}

SH.Stdin.prototype = {
    // writeLine adds a line to standard input, which can then
    // be read by a subsequent call to readLine
    writeLine: function (line) {
        this.line = line;
        this._process();
    },

    readLine: function (fn) {
        this.fn = fn;
        this._process();
    },

    _process: function () {
        var line = this.line,
            fn = this.fn;

        if (line !== undefined && fn !== undefined) {
            this._reset();
            fn(line);
        }
    },

    _reset: function () {
        this.line = undefined;
        this.fn = undefined;
    }
};