(function () {
    // Autosize textarea directive
    Vue.component('autosize-textarea', {
        template: '<div class="autosize-textarea"><textarea v-model="val" autocomplete="off"></textarea><pre>{{val}} \n \n</pre></div>'
    });
    
    // Commandline vue controller
    new Vue({
        el: '#cmd-container',
        data: {
            currentCommand: '...'
        },

        methods: {
            executeCmd: function (e) {
                e.preventDefault();
                document.title = 'Executing';
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