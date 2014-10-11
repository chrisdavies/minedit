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
            ctx.push(ctx.fs.path + '/');
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
    
    // Command context
    function CommandContext(data, fs) {
        this.data = data;
        this.fs = fs;
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

        pushError: function (msg) {
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

        this.path = '';
    }

    FileSystem.prototype = {
        ls: function () {
            var p = new Plite();
            p.resolve(this.dir.children);
            return p;
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

                    var ctx = new CommandContext(this.$data, fs),
                        cmdText = this.currentCommand.split(' ', 2)[0],
                        cmd = cmds.get(cmdText);

                    ctx.push('$ ' + this.currentCommand);

                    if (!cmd) {
                        ctx.pushError('Command "' + cmdText + '" not recognized.');
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