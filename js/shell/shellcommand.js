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

    this.app = undefined;

    // TODO: use size() function instead, to be consistent w/ CappedBuffer
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
    },

    // TODO: Move this to a more appropriate place: runs the specified app
    // This is unrelated to shell command. Probably should go in ShellEnvironment
    run: function (appName, appData) {
        this.app = {
            name: appName,
            data: appData
        };
    }
};