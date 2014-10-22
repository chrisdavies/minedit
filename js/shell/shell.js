// Defines the shell object, which is a singleton representing
// the current shell context
(function () {
    function Shell() {
        this.stdin = new SH.Stdin();
        this.stdout = new SH.Stdout(1000);
        this.history = new SH.ShellHistory(10);
        this.commands = new SH.ShellEnvironment();
        this.status = {
            running: false,
            app: null
        };
    }

    Shell.prototype = {
        run: function () {
            this.stdin.readLine(processInput);
        },

        runApp: function (name, data) {
            this.status.app = {
                name: name,
                data: data
            };
        }
    };

    // Set up the shell singleton property (and self-reference)
    var me = SH.shell = new Shell();

    // Private functions to read/process shell commands
    function inputProcessed(args) {
        me.status.running = false;
        me.stdin.readLine(processInput);
    }

    function writeErr(err) {
        me.stdout.writeLine(err.err || err, 'red');
    }

    function validate(args, cmd) {
        if (!cmd) {
            writeErr('Unrecognized command: ' + args.command);
            return false;
        }

        var requiredParams = (cmd.params || []).filter(function (p) { return p.required; });
        if (requiredParams.length > args.length) {
            writeErr(args.command + ': requires the following arguments - ' + requiredParams.map(function (p) { return p.name; }).join(', '));
            writeErr('Try "man ' + args.command + '" for more information.');
            return false;
        }

        return true;
    }

    function processInput(line) {
        me.status.running = true;

        // Write the command to the terminal
        me.stdout.writeLine();
        me.stdout.writeLine('$ ' + line);

        // Write the command to the history
        me.history.push(line);

        // Parse the command
        var args = new SH.ShellCommand(line);

        // Lookup a matching command
        if (args.command) {
            var cmd = me.commands.get(args.command);

            if (validate(args, cmd)) {
                // Execute the command
                try {
                    var p = cmd.execute(args);

                    if (p) {
                        if (p.catch && p.then) {
                            return p.catch(writeErr).finally(function () {
                                inputProcessed(args);
                            });
                        } else if (p.err) {
                            writeErr(p);
                        }
                    }
                } catch (err) {
                    writeErr(err);
                }
            }
        }

        inputProcessed(args);
    }
})();
