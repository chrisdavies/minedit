var SH = (function () {
    function CappedBuffer(maxSize) {
        this.buffer = [];
        this.maxSize = maxSize;
    }

    CappedBuffer.prototype = {
        push: function (val) {
            this.buffer.push(val);

            if (this.buffer.length > this.maxSize) {
                this.buffer.shift();
            }
        },

        size: function () {
            return this.buffer.length;
        },

        get: function (i) {
            return this.buffer[i];
        },

        clear: function () {
            this.buffer.splice(0, this.buffer.length);
        }
    }

    function Stdin() {
        this.line;
        this.fn;
    }

    Stdin.prototype = {
        writeLine: function (line) {
            this.line = line;
            this.process();
        },

        readLine: function (fn) {
            this.fn = fn;
            this.process();
        },

        process: function () {
            var line = this.line,
                fn = this.fn;

            if (line !== undefined && fn !== undefined) {
                this.reset();
                fn(line);
            }
        },

        reset: function () {
            this.line = undefined;
            this.fn = undefined;
        }
    };

    function Stdout(maxSize) {
        this.buffer = new CappedBuffer(maxSize);
    }

    Stdout.prototype = {
        writeLine: function (line, color) {
            this.buffer.push({
                color: color,
                value: line || ' ',
            });
        },

        clear: function () {
            this.buffer.clear();
        },

        pad: function (str, num, truncate) {
            str = str || '';

            if (str.length < num) {
                return str + Array(num - str.length).join(' ');
            } else if (str.length > num && truncate) {
                return str.substr(0, num);
            }

            return str;
        }
    }

    function ShellHistory(maxSize) {
        this.buffer = new CappedBuffer(maxSize);
        this.index = 0;
    }

    ShellHistory.prototype = {
        push: function (line) {
            if (this.buffer.size() && this.buffer.get(this.buffer.size() - 1) == line) {
                return;
            }

            this.buffer.push(line);
            this.index = this.buffer.size();
        },

        up: function () {
            this.index = Math.max(-1, this.index - 1);
            return this.buffer.get(this.index) || '';
        },

        down: function () {
            this.index = Math.min(this.buffer.size(), this.index + 1);
            return this.buffer.get(this.index) || '';
        }
    }

    function ShellCommand(line) {
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
    }

    ShellCommand.prototype = {
        size: function () {
            return this.params.length;
        },

        get: function (i) {
            return this.params[i];
        },

        has: function (arg) {
            return this.params.indexOf(arg) >= 0;
        },

        last: function () {
            return this.params[this.params.length - 1];
        },

        run: function (appName, appData) {
            this.app = {
                name: appName,
                data: appData
            };
        }
    };

    function ShellEnvironment() {
        this.commands = {};
    }

    ShellEnvironment.prototype = {
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
    
    function Shell() {
        this.stdin = new Stdin();
        this.stdout = new Stdout(1000);
        this.history = new ShellHistory(10);
        this.commands = new ShellEnvironment();
        this.status = {
            running: false,
            app: null
        };
    }

    Shell.prototype = {
        run: function () {
            var me = this;

            function inputProcessed(args) {
                me.status.app = args.app;
                me.status.running = false;
                me.stdin.readLine(processInput);
            }

            function processInput(line) {
                me.status.running = true;

                // Write the command to the terminal
                me.stdout.writeLine('$ ' + line);

                // Write the command to the history
                me.history.push(line);

                // Parse the command
                var args = new ShellCommand(line);

                // Lookup a matching command
                if (args.command) {
                    var cmd = me.commands.get(args.command);

                    if (!cmd) {
                        me.stdout.writeLine('Unrecognized command: ' + args.command);
                    } else {
                        // Execute the command
                        try {
                            var p = cmd.execute(args);

                            if (p && p.catch && p.then) {
                                return p.catch(function (result) {
                                    me.stdout.writeLine(result.err || result, 'red');
                                }).finally(function () {
                                    inputProcessed(args);
                                });
                            }
                        } catch (err) {
                            me.stdout.writeLine(err, 'red');
                        }
                    }
                }

                inputProcessed(args);
            }

            this.stdin.readLine(processInput);
        }
    }

    return {
        // Fields
        shell: new Shell(),

        // Objects
        Stdin: Stdin,
        Stdout: Stdout,
        ShellCommand: ShellCommand,
        ShellHistory: ShellHistory
    };
})();

// Standard shell commands
(function (shell) {
    var stdout = shell.stdout;
    
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

    shell.commands.add({
        name: 'clear',
        description: 'Clear the shell terminal',

        execute: function () {
            stdout.clear();
        }
    });

    shell.commands.add({
        name: 'man',
        description: 'Display usage manual for the specified command',
        params: [{
            name: 'command',
            required: true
        }],

        execute: function (args) {
            var cmdName = args.last(),
                cmd = shell.commands.get(cmdName);

            if (!cmd) {
                stdout.writeLine('Could not find command: ' + cmdName, 'red');
                return;
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
    })

})(SH.shell);