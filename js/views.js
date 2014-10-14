﻿(function () {
    
    function focusTextbox() {
        document.getElementsByTagName('textarea').item(0).focus();
    }

    // Autosize textarea directive
    Vue.component('autosize-textarea', {
        template: '<div class="autosize-textarea"><textarea v-model="val" autocomplete="off"></textarea><pre>{{val}} \n \n</pre></div>'
    });

    // Editor view
    Vue.component('cmd-editor', {
        template: '#cmd-editor-template',

        ready: function () {
            setTimeout(focusTextbox, 10);
        },

        methods: {
            exit: function (e) {
                // TODO: Exit editor
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

        ready: function () {
            setTimeout(focusTextbox, 10);
        },

        methods: {
            feedLine: function (e) {
                e.preventDefault();

                // TODO: Enter text into stdin
            },

            autoComplete: function (e) {
                e.preventDefault();
                
                // TODO: Autocomplete the current line
            },

            cancelCommand: function (e) {
                // TODO: 
            }
        }
    });

    // Root view
    new Vue({
        el: '#cmd-container',

        methods: {
            focusTextbox: focusTextbox
        }
    });

})();