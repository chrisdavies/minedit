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
                helpTable = [];

            for (var f in allCmds) {
                var c = allCmds[f];
                helpTable.push([c.command + (c.params ? ' ' +  c.params : ''), c.description]);
            }

            ctx.push(helpTable);
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
    function CommandContext(data) {
        this.data = data;
    }

    CommandContext.prototype = {
        clear: function () {
            this.data.lines = [];
        },

        push: function (dataSet) {
            this.data.totalLines += dataSet.length;
            this.data.lines.push(dataSet);
        },

        pushError: function (msg) {
            this.push([[msg]]);
        }
    };


    // VUES /////////////////////////////////////////

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

                var ctx = new CommandContext(this.$data),
                    cmdText = this.currentCommand.split(' ', 2)[0],
                    cmd = cmds.get(cmdText);

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