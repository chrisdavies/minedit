(function (ns) {

    function focusTextbox() {
        var tas = document.getElementsByTagName('textarea');

        if (tas.length) {
            var txt = tas.item(0);
            txt.focus();
            txt.scrollIntoView(false);
        }
    }

    // Autosize textarea directive
    Vue.component('autosize-textarea', {
        template: '<div class="autosize-textarea"><textarea v-model="val" autocomplete="off"></textarea><pre>{{val}} \n \n</pre></div>'
    });

    // Editor view
    Vue.component('file-editor', {
        template: '#file-editor-template',

        ready: function () {
            var me = this;

            me.saving = false;
            me.currentVersion = me.savedVersion = 0;

            me.setTitle();

            setTimeout(focusTextbox, 10);

            window.onbeforeunload = function () {
                if (!me.isSaved()) {
                    return 'You have unsaved changes. Are you sure you want to exit?';
                }
            }

            me.$watch('app.data.content', function () {
                ++me.currentVersion;
            });
        },

        methods: {
            isSaved: function () {
                return this.currentVersion == this.savedVersion;
            },

            exit: function (e) {
                if (this.isSaved() || confirm('You have unsaved changes. Are you sure you want to exit?')) {
                    this.app = null;
                }
            },

            setTitle: function (prefix) {
                document.title = (prefix || '') + this.app.data.file.name;
            },

            detectSpecialInput: function (e) {
                if (e.ctrlKey && e.which == 83) { // Ctrl + S 
                    this.save(e);
                } else if (e.which == 9) { // Tab
                    this.insertTab(e);
                }
            },

            insertTab: function (e) {
                e.preventDefault();
                var ta = this.$el.querySelector('textarea'),
                    start = ta.selectionStart,
                    end = ta.selectionEnd;

                ta.value = ta.value.substring(0, start) + '\t' + ta.value.substring(end);
                ta.selectionStart = ta.selectionEnd = (start + 1);
            },

            save: function (e) {
                e.preventDefault();

                var me = this,
                    data = me.app.data;

                me.saving = true;
                me.setTitle('Saving... ');

                ns.fs.saveFile(data.file.id, data.content).then(function () {
                    me.currentVersion = me.savedVersion;
                 }).catch(function (err) {
                    console.log(err);
                    alert('Failed to save. See console.log for details.');
                 }).finally(function () {
                     me.saving = false;
                     me.setTitle();
                 });
            }
        }
    });

    // Shell view
    Vue.component('cmd-shell', {
        template: '#cmd-shell-template',

        data: {
            shellLines: SH.shell.stdout.buffer.buffer,
            shellStatus: SH.shell.status,
            currentCommand: ''
        },

        ready: function () {
            var me = this;

            setTimeout(focusTextbox, 10);
            document.title = 'MinEdit $shell';

            me.$watch('shellStatus', function () {
                !me.shellStatus.running && Vue.nextTick(focusTextbox);
            });
        },

        methods: {
            feedLine: function (e) {
                e.preventDefault();

                ns.stdin.writeLine(this.currentCommand);
                this.currentCommand = '';
            },

            autoComplete: function (e) {
                e.preventDefault();
                
                // TODO: Autocomplete the current line
            },

            cancelCommand: function (e) {
                ns.stdout.writeLine('$ ' + this.currentCommand);
                this.currentCommand = '';
            },

            historyUp: function () {
                this.currentCommand = ns.history.up();
            },

            historyDown: function () {
                this.currentCommand = ns.history.down();
            }
        }
    });

    // Root view
    new Vue({
        el: '#cmd-container',

        data: {
            shellStatus: SH.shell.status,
        },

        computed: {
            isRunningApp: function () {
                return !!this.shellStatus.app;
            }
        },

        methods: {
            focusTextbox: focusTextbox
        }
    });

    ns.run();

})(SH.shell);