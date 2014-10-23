'use asm';

// ShellCommand parses a shell command and provides access to its key parts
SH.ShellCommand = function (line) {
    this.original = line;

    this.params = line.match(/\"[^\"]*\"|[^\s]*/g).map(function (v) {
        if (v.length && v.charAt(0) == '"') {
            return v.substr(1, v.length - 2);
        }

        return v;
    }).filter(function (l) {
        return l.length;
    });

    this.command = this.params.shift();

    this.length = this.params.length;
}

SH.ShellCommand.prototype = {
    get: function (i) {
        return this.params[i];
    },

    has: function (arg) {
        return this.params.indexOf(arg) >= 0;
    },

    last: function () {
        return this.params[this.params.length - 1];
    }
};