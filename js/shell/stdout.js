'use asm';

// Stdout controls output to the shell
SH.Stdout = function (maxSize) {
    this.buffer = new SH.CappedBuffer(maxSize);
}

SH.Stdout.prototype = {
    writeLine: function (line, color) {
        this.buffer.push({
            color: color,
            value: line || ' ',
        });
    },

    clear: function () {
        this.buffer.clear();
    },

    // Probably should go elsewhere, but is handy for fixed-formatting
    // strings when writing to the terminal
    pad: function (str, num, truncate) {
        str = str || '';

        if (str.length < num) {
            return str + Array(num - str.length).join(' ');
        } else if (str.length > num && truncate) {
            return str.substr(0, num);
        }

        return str;
    }
}