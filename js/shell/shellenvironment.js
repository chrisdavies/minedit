// ShellEnvironment represents the shell environment (think OS).
// So, commands/apps can be registered and controlled here.
SH.ShellEnvironment = function () {
    this.commands = {};
}

SH.ShellEnvironment.prototype = {
    all: function () {
        var result = [];

        for (var field in this.commands) {
            result.push(this.commands[field]);
        }

        return result;
    },

    add: function (cmd) {
        this.commands[cmd.name] = cmd;
    },

    get: function (name) {
        return this.commands[name];
    }
}
