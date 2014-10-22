// ShellHistory tracks and navigates the history of shell commands
SH.ShellHistory = function (maxSize) {
    this.buffer = new SH.CappedBuffer(maxSize);
    this.index = 0;
}

SH.ShellHistory.prototype = {
    push: function (line) {
        if (this.buffer.size() && this.buffer.get(this.buffer.size() - 1) == line) {
            return;
        }

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