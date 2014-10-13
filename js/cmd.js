(function () {
    var cmds = {
        registered: {},

        register: function (cmd) {
            this.registered[cmd.command] = cmd;
        },

        all: function () {
            return this.registered;
        },

        get: function (name) {
            return this.registered[name];
        }
    };

    // Commandline processor
    function CommandLine(line) {
        line = line || '';

        this.line = line;
        this.pieces = line.match(/\"[^\"]*\"|[^\s]*/g).filter(function (l) { return l.length; });
    }

    // Help command
    cmds.register({
        command: 'help',
        description: 'Show available commands',

        execute: function (ctx) {
            var allCmds = cmds.all(),
                dataSet = [];

            for (var f in allCmds) {
                var c = allCmds[f];
                dataSet.push([c.command + (c.params ? ' ' +  c.params : ''), c.description]);
            }

            dataSet.sort(function (a, b) {
                return (a[0] < b[0] ? -1 : 1);
            });

            dataSet.push(['<Esc>', 'Cancel the current command without running it']);

            ctx.push(dataSet);
        }
    });

    // Pwd command
    cmds.register({
        command: 'pwd',
        description: 'Show the path for the current directory',

        execute: function (ctx) {
            ctx.push(ctx.fs.fullPath());
        }
    });

    // Ls command 
    cmds.register({
        command: 'ls',
        description: 'List the content of the current directory',

        execute: function (ctx) {
            var children = ctx.fs.dir.children || [],
                dataSet = [];

            for (var i = 0; i < children.length; ++i) {
                var c = children[i];
                dataSet.push([c.type, c.name]);
            }

            ctx.push(dataSet);
        }
    });

    // Clear command
    cmds.register({
        command: 'clear',
        description: 'Clear the screen',

        execute: function (ctx) {
            ctx.clear();
        }
    });

    // Open command
    cmds.register({
        command: 'open',
        params: '{name}',
        description: 'Opens the specified file, creating it if it doesn\'t exist',

        execute: function (ctx) {
            var cmd = ctx.commandLine.pieces;

            if (cmd.length != 2) {
                ctx.pushErr('File name is required');
                return;
            }

            var fileName = cmd[1],
                result = ctx.fs.load(fileName);
            
            if (!result.err) {
                ctx.data.file = result;
            }

            return result;
        }
    });
    
    // Mkdir command 
    cmds.register({
        command: 'mkdir',
        params: '{name}',
        description: 'Make a directory of the specified name',

        execute: function (ctx) {
            var cmd = ctx.commandLine.pieces;

            if (cmd.length != 2) {
                ctx.pushErr('Directory name is required');
                return;
            }

            var result = ctx.fs.mkdir(cmd[1]);

            if (result.err) {
                ctx.pushErr(result.err);
            }
        }
    });

    // rm command
    cmds.register({
        command: 'rm',
        params: '{name}',
        description: 'Remove the specified file or directory',

        execute: function (ctx) {
            var cmd = ctx.commandLine.pieces;

            if (cmd.length != 2) {
                ctx.pushErr('Directory name is required');
                return;
            }

            var result = ctx.fs.rm(cmd[1]);

            if (result.err) {
                ctx.pushErr(result.err);
            }
        }
    });

    // cd command
    cmds.register({
        command: 'cd',
        params: '{name}',
        description: 'Navigate to the specified directory',

        execute: function (ctx) {
            var cmd = ctx.commandLine.pieces;

            if (cmd.length != 2) {
                ctx.pushErr('Directory name is required');
                return;
            }

            var result = ctx.fs.cd(cmd[1]);

            if (result.err) {
                ctx.pushErr(result.err);
            }
        }
    });

    // Command context
    function CommandContext(data, fs, commandLine) {
        this.data = data;
        this.fs = fs;
        this.commandLine = new CommandLine(commandLine);
    }

    CommandContext.prototype = {
        clear: function () {
            this.data.lines = [];
        },

        push: function (dataSet) {
            if (typeof (dataSet) === 'string') {
                dataSet = [[dataSet]];
            }

            this.data.totalLines += dataSet.length;
            this.data.lines.push(dataSet);
        },

        pushErr: function (msg) {
            this.push(msg);
        }
    };
        
    // VUES /////////////////////////////////////////
    (function () {
        var fs = new FileSystem(),
            appData = {
                currentCommand: '',
                lines: [],
                totalLines: 0,
                file: null
            };

        function focusTextbox() {
            document.getElementsByTagName('textarea').item(0).focus();
        }

        // Autosize textarea directive
        Vue.component('autosize-textarea', {
            template: '<div class="autosize-textarea"><textarea v-model="val" autocomplete="off"></textarea><pre>{{val}} \n \n</pre></div>'
        });

        Vue.component('cmd-file', {
            template: '#cmd-file-template',

            ready: function () {
                setTimeout(focusTextbox, 10);
            },

            methods: {
                quitEditor: function (e) {
                    this.file = null;
                },

                detectSaveCommand: function (e) {
                    if (e.ctrlKey && e.which == 83) { // Ctrl + S 
                        e.preventDefault();
                        fs.save(this.file);
                    } else if (e.which == 9) { // Tab
                        e.preventDefault();
                        var ta = this.$el.querySelector('textarea'),
                            start = ta.selectionStart,
                            end = ta.selectionEnd;

                        ta.value = ta.value.substring(0, start) + '\t' + ta.value.substring(end);
                        ta.selectionStart = ta.selectionEnd = (start + 1);
                    }
                }
            }
        });

        Vue.component('cmd-prompt', {
            template: '#cmd-prompt-template',

            ready: function () {
                setTimeout(focusTextbox, 10);
            },

            methods: {
                executeCmd: function (e) {
                    e.preventDefault();

                    var ctx = new CommandContext(appData, fs, this.currentCommand),
                        cmdText = ctx.commandLine.pieces[0],
                        cmd = cmds.get(cmdText);

                    ctx.push('$ ' + ctx.commandLine.line);

                    if (!cmd) {
                        ctx.pushErr('Command "' + cmdText + '" not recognized.');
                    } else {
                        cmd.execute(ctx);
                    }

                    this.currentCommand = '';
                },

                autoCompleteCmd: function (e) {
                    e.preventDefault();
                    document.title = 'Autocompleting';
                },

                escCmd: function (e) {
                    var ctx = new CommandContext(this.$data, fs, this.currentCommand);
                    ctx.push('$ ' + ctx.commandLine.line);
                    this.currentCommand = '';
                }
            }
        });

        // Commandline vue controller
        new Vue({
            el: '#cmd-container',

            data: {
                appData: appData
            },

            methods: {
                focusTextbox: focusTextbox
            }
        });
    })();

})();