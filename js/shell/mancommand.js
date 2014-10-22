﻿// The man command
(function (shell) {
    var stdout = shell.stdout;

    shell.commands.add({
        name: 'man',
        description: 'Display usage manual for the specified command',
        params: [{
            name: 'command'
        }],

        execute: function (args) {
            var cmdName = args.last() || 'man',
                cmd = shell.commands.get(cmdName);

            if (!cmd) {
                return { err: 'Could not find command: ' + cmdName };
            }

            var params = cmd.params || [];
            cmdParams = params.map(function (p) {
                var name = p.name;
                if (!p.required) {
                    return '[' + name + ']';
                }

                return name.charAt(0) == '-' ? name : '<' + name + '>';
            });

            stdout.writeLine();
            stdout.writeLine('NAME');
            stdout.writeLine('    ' + cmdName + ' - ' + cmd.description);
            stdout.writeLine();
            stdout.writeLine('SYNOPSIS');
            stdout.writeLine('    ' + cmdName + ' ' + cmdParams.join(' '));
            stdout.writeLine();

            var options = params.filter(function (p) { return p.description; });

            if (options.length) {
                stdout.writeLine('OPTIONS');
                for (var i = 0; i < options.length; ++i) {
                    var p = options[i];
                    if (p.description) {
                        stdout.writeLine('    ' + stdout.pad(p.name, 7) + ' ' + (p.required ? '(required) ' : '') + p.description);
                    }
                }

                stdout.writeLine();
            }
        }
    });
})(SH.shell);