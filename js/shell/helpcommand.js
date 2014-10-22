// The help command
(function (shell) {
    var stdout = shell.stdout;

    // help command
    shell.commands.add({
        name: 'help',
        description: 'Display available shell commands',

        execute: function () {
            var commands = shell.commands.all().sort(function (a, b) { return a.name > b.name ? 1 : -1; });

            for (var i = 0; i < commands.length; ++i) {
                var cmd = commands[i];
                stdout.writeLine(stdout.pad(cmd.name, 10) + ' ' + cmd.description);
            }
        }
    });
})(SH.shell);