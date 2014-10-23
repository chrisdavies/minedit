'use asm';

// CappedBuffer represents a buffer that will never exceed maxSize.
// The oldest value will be dropped when a new value is
// pushed and maxSize has been met.
SH.CappedBuffer = function (maxSize) {
    this.buffer = [];
    this.maxSize = maxSize;
}

SH.CappedBuffer.prototype = {
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
        return this.buffer[i];
    },

    clear: function () {
        this.buffer.splice(0, this.buffer.length);
    }
};