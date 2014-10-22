// The clear command
(function (shell) {
    shell.commands.add({
        name: 'clear',
        description: 'Clear the shell terminal',

        execute: function () {
            shell.stdout.clear();
        }
    });
})(SH.shell);