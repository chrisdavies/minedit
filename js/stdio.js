function CappedBuffer(maxSize) {
    this.buffer = [];
    this.maxSize = maxSize;
}

CappedBuffer.prototype = {
    push: function (val) {
        this.buffer.push(val);

        if (this.buffer.length > this.maxSize) {
            this.buffer.shift();
        }
    },

    size: function () {
        return this.buffer.length;
    },

    get: function (i) {
        return i >= 0 && i <= this.buffer.length ? this.buffer[i] : undefined;
    },

    clear: function () {
        this.buffer.splice(0, this.buffer.length);
    }
}

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
    this.buffer = new CappedBuffer(maxSize);
}

Stdout.prototype = {
    writeLine: function (line, color) {
        this.buffer.push(color ? {
            color: color,
            toString: function () {
                return line;
            }
        } : line);
    },

    clear: function () {
        this.buffer.clear();
    }
}

function ShellHistory(maxSize) {
    this.buffer = new CappedBuffer(maxSize);
    this.index = 0;
}

ShellHistory.prototype = {
    push: function (line) {
        this.buffer.push(line);
        this.index = this.buffer.size();
    },

    up: function () {
        this.index = Math.max(-1, this.index - 1);
        return this.buffer.get(this.index) || '';
    },

    down: function () {
        this.index = Math.min(this.buffer.size(), this.index + 1);
        return this.buffer.get(this.index) || '';
    }
}

function ShellCommand(line) {
    this.original = line;
    this.params = line.match(/\"[^\"]*\"|[^\s]*/g).map(function (v) {
        if (v.length && v.charAt(0) == '"') {
            return v.substr(1, v.length - 2);
        }

        return v;
    }).filter(function (l) {
        return l.length;
    });
}

function Shell() {
    this.stdin = new Stdin();
    this.stdout = new Stdout(1000);
    this.history = new ShellHistory(10);
}