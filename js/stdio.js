function Stdin() {
    this.line;
    this.fn;
}

Stdin.prototype = {
    writeLine: function (line) {
        this.line = line;
        this.process();
    },

    readLine: function (fn) {
        this.fn = fn;
        this.process();
    },

    process: function () {
        if (this.line !== undefined && this.fn !== undefined) {
            this.fn(this.line);

            this.reset();
        }
    },

    reset: function () {
        this.line = undefined;
        this.fn = undefined;
    }
};

function Stdout(maxSize) {
    this.buffer = [];
    this.maxSize = maxSize || 100;
}

Stdout.prototype = {
    writeLine: function (line, color) {
        this.buffer.push(color ? {
            color: color,
            toString: function () {
                return line;
            }
        } : line);

        if (this.buffer.length > this.maxSize) {
            this.buffer.shift();
        }
    }
}