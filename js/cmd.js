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


    // File system //////////////////////////////////
    function FileSystem() {
        this.root = {
            name: '',
            type: 'd',

            children: [{
                name: 'My Docs',
                type: 'd',

                children: [{
                    name: 'bar.txt',
                    type: 'f'
                }]
            }, {
                name: 'Stories',
                type: 'd',

                children: []
            }, {
                name: 'foo.txt',
                type: 'f'
            }]
        },

        this.dir = this.root;
    }

    FileSystem.prototype = {
        ls: function () {
            var p = new Plite();
            p.resolve(this.dir.children);
            return p;
        },

        mkdir: function (name) {
            name = this.cleanName(name);
            if (this.find(name)) {
                return { err: name + ' already exists.' };
            }

            this.dir.children.push({
                type: 'd',
                name: name,
                children: []
            });

            return {};
        },

        rm: function (name) {
            name = this.cleanName(name);
            var children = this.dir.children.filter(function (c) { return c.name != name; });
            if (children.length == this.dir.children.length) {
                return { err: 'Could not find ' + name };
            }

            this.dir.children = children;
            return {};
        },

        cd: function (name) {
            name = this.cleanName(name);
            var dir = this.find(name);

            if (!dir) {
                return { err: 'Could not find ' + name };
            }

            if (dir.type != 'd') {
                return { err: name + ' is not a directory' };
            }

            this.dir = dir;
            return dir;
        },

        cleanName: function (name) {
            return (name || '').trim().replace(/["']/g, '');
        },

        fullPath: function () {
            return '/' + this.dir.name;
        },

        find: function (name) {
            var result;

            this.dir.children.some(function (c) {
                if (c.name == name) {
                    result = c;
                    return true;
                }

                return false;
            });

            return result;
        }
    };

    
    // VUES /////////////////////////////////////////
    (function () {
        var fs = new FileSystem();

        // Autosize textarea directive
        Vue.component('autosize-textarea', {
            template: '<div class="autosize-textarea"><textarea v-model="val" autocomplete="off"></textarea><pre>{{val}} \n \n</pre></div>'
        });

        // Commandline vue controller
        new Vue({
            el: '#cmd-container',
            data: {
                currentCommand: '',
                lines: [],
                totalLines: 0
            },

            ready: function () {
                this.focusCmd();
            },

            methods: {
                executeCmd: function (e) {
                    e.preventDefault();

                    var ctx = new CommandContext(this.$data, fs, this.currentCommand),
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

                focusCmd: function () {
                    document.getElementsByTagName('textarea').item(0).focus();
                }
            }
        });
    })();

})();