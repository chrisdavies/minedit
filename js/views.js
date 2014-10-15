﻿(function (ns) {
    
    function focusTextbox() {
        document.getElementsByTagName('textarea').item(0).focus();
    }

    // Autosize textarea directive
    Vue.component('autosize-textarea', {
        template: '<div class="autosize-textarea"><textarea v-model="val" autocomplete="off"></textarea><pre>{{val}} \n \n</pre></div>'
    });

    // Editor view
    Vue.component('file-editor', {
        template: '#file-editor-template',

        ready: function () {
            this.fileContent = this.app.file.title;
            setTimeout(focusTextbox, 10);
        },

        methods: {
            exit: function (e) {
                this.app = null;
            },

            detectSpecialInput: function (e) {
                if (e.ctrlKey && e.which == 83) { // Ctrl + S 
                    e.preventDefault();
                    // TODO: Save
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

            me.$watch('shellStatus', function () {
                !me.shellStatus.running && Vue.nextTick(function () {
                    var txt = document.getElementsByTagName('textarea').item(0);
                    txt.focus();
                    txt.scrollIntoView(false);
                });
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