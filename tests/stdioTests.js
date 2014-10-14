(function () {
    QUnit.module('stdin');

    QUnit.test('calls the fn if available', function (assert) {
        var stdin = new Stdin();

        stdin.readLine(function (line) {
            assert.equal(line, 'hello, world!');
        })

        stdin.writeLine('hello, world!');
    });

    QUnit.test('processes one line at a time', function (assert) {
        var stdin = new Stdin();
        stdin.writeLine('yo');

        stdin.readLine(function (line) {
            assert.equal(line, 'yo');
        });

        stdin.writeLine('foo');

        stdin.readLine(function (line) {
            assert.equal(line, 'foo');
        });
    });

    QUnit.module('stdout');

    QUnit.test('respects buffer bounds', function (assert) {
        var stdout = new Stdout(5);

        for (var i = 0; i < 10; ++i) {
            stdout.writeLine(i.toString());
        }

        var actual = stdout.buffer.buffer,
            expected = [5, 6, 7, 8, 9];

        assert.equal(actual.length, expected.length);

        for (var i = 0; i < actual.length; ++i) {
            assert.equal(expected[i].toString(), actual[i].toString());
        }
    });

    QUnit.test('retains color info', function (assert) {
        var stdout = new Stdout();

        stdout.writeLine('G', 'green');
        stdout.writeLine('Default');

        var buffer = stdout.buffer.buffer;

        assert.equal(buffer[0].toString(), 'G');
        assert.equal(buffer[0].color, 'green');

        assert.equal(buffer[1].toString(), 'Default');
        assert.equal(buffer[1].color, undefined);
    });

    QUnit.test('clear clears the array', function (assert) {
        var stdout = new Stdout();

        stdout.writeLine('hello');
        stdout.writeLine('world');

        assert.equal(stdout.buffer.size(), 2);
        stdout.clear();
        assert.equal(stdout.buffer.size(), 0);
    });

    QUnit.module('shellhistory');

    QUnit.test('up respects bounds', function (assert) {
        var hist = new ShellHistory(4);

        for (var i = 0; i < 6; ++i) {
            hist.push(i.toString());
        }

        var expected = [5, 4, 3, 2, ''];

        for (var i = 0; i < expected.length; ++i) {
            assert.equal(hist.up(), expected[i].toString());
        }
    });

    QUnit.test('down respects bounds', function (assert) {
        var hist = new ShellHistory(4);

        for (var i = 0; i < 6; ++i) {
            hist.push(i.toString());
        }

        assert.equal(hist.down(), '');
        assert.equal(hist.up(), '5');
        assert.equal(hist.up(), '4');
        assert.equal(hist.down(), '5');
        assert.equal(hist.down(), '');
    });
    
    QUnit.test('push resets index', function (assert) {
        var hist = new ShellHistory(4);

        for (var i = 0; i < 6; ++i) {
            hist.push(i.toString());
        }

        assert.equal(hist.up(), '5');
        assert.equal(hist.up(), '4');
        assert.equal(hist.up(), '3');

        hist.push('foo');

        assert.equal(hist.up(), 'foo');
        assert.equal(hist.up(), '5');
        assert.equal(hist.up(), '4');
    });

    QUnit.module('shellcommand');

    QUnit.test('strips quotes from parameters', function (assert) {
        var cmd = new ShellCommand('cd "hello/world"');

        assert.equal(cmd.params.length, 2);
        assert.equal(cmd.params[0], 'cd');
        assert.equal(cmd.params[1], 'hello/world');
    });

    QUnit.test('handles multiple parameters', function (assert) {
        var cmd = new ShellCommand('hello world and everyone'),
            expected = ['hello', 'world', 'and', 'everyone'];

        assert.equal(cmd.params.length, expected.length);

        for (var i = 0; i < expected.length; ++i) {
            assert.equal(expected[i], cmd.params[i]);
        }
    });

})();
