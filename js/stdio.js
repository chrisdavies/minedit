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
            this.buffer.push(color ? {
                color: color,
                toString: function () {
                    return line;
                }
            } : line);
        },

        clear: function () {
            this.buffer.clear();
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
    }

    ShellCommand.prototype = {
        size: function () {
            return this.params.length;
        },

        get: function (i) {
            return this.params[i];
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

    function pad(str, num, truncate) {
        str = str || '';
        
        if (str.length < num) {
            return str + Array(num - str.length).join(' ');
        } else if (str.length > num && truncate) {
            return str.substr(0, num);
        }

        return str;
    }

    function Shell() {
        this.stdin = new Stdin();
        this.stdout = new Stdout(1000);
        this.history = new ShellHistory(10);
        this.commands = new ShellEnvironment();
        this.pad = pad;
    }

    Shell.prototype = {
        run: function () {
            var me = this;

            function processInput(line) {
                // Write the command to the terminal
                me.stdout.writeLine('$ ' + line);

                // Write the command to the history
                me.history.push(line);

                // Parse the command
                var args = new ShellCommand(line);

                // Lookup a matching command
                if (args.size()) {
                    var cmd = me.commands.get(args.get(0));

                    if (!cmd) {
                        me.stdout.writeLine('Could not find ' + args.get(0));
                    } else {
                        // Execute the command
                        cmd.execute(args);
                    }
                }

                me.stdin.readLine(processInput);
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

    shell.commands.add({
        name: 'help',
        description: 'Display available shell commands',

        execute: function () {
            var commands = shell.commands.all();

            for (var i = 0; i < commands.length; ++i) {
                var cmd = commands[i];
                shell.stdout.writeLine(shell.pad(cmd.name, 10) + ' ' + cmd.description);
            }
        }
    });

    shell.commands.add({
        name: 'clear',
        description: 'Clear the shell terminal',

        execute: function () {
            shell.stdout.clear();
        }
    });

})(SH.shell);