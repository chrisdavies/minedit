(function () {
    QUnit.module('stdin');

    QUnit.test('writeLine calls the fn if available', function (assert) {
        var stdin = new Stdin();

        stdin.readLine(function (line) {
            assert.equal(line, 'hello, world!');
        })

        stdin.writeLine('hello, world!');
    });

    QUnit.test('readLine processes one line at a time', function (assert) {
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

    QUnit.test('writeLine respects buffer bounds', function (assert) {
        var stdout = new Stdout(5);

        for (var i = 0; i < 10; ++i) {
            stdout.writeLine(i.toString());
        }

        var actual = stdout.buffer,
            expected = [5, 6, 7, 8, 9];

        assert.equal(actual.length, expected.length);

        for (var i = 0; i < actual.length; ++i) {
            assert.equal(expected[i].toString(), actual[i].toString());
        }
    });

    QUnit.test('writeLine retains color info', function (assert) {
        var stdout = new Stdout();

        stdout.writeLine('G', 'green');
        stdout.writeLine('Default');

        assert.equal(stdout.buffer[0].toString(), 'G');
        assert.equal(stdout.buffer[0].color, 'green');

        assert.equal(stdout.buffer[1].toString(), 'Default');
        assert.equal(stdout.buffer[1].color, undefined);
    })
})();
