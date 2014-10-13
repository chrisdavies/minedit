(function () {
    function defaultDir() {
        function Newable() {
            this.root = {
                name: '',
                type: 'd',

                children: [{
                    name: 'My Docs',
                    type: 'd',

                    children: [{
                        name: 'aha.txt',
                        type: 'f'
                    }, {
                        name: 'Bar',
                        type: 'd'
                    }, {
                        name: 'aa.a',
                        type: 'f'
                    }]
                }, {
                    name: 'Stories',
                    type: 'd',

                    children: []
                }, {
                    name: 'foo.txt',
                    type: 'f'
                }]
            };
        }

        return new FileSystem(new Newable().root);
    }

    (function cdTests() {
        QUnit.module('cd');

        QUnit.test('cd navigates down and up', function (assert) {
            var fs = defaultDir();

            assert.ok(fs.cd('My Docs/Bar/').err === undefined);
            assert.equal(fs.fullPath(), '/My Docs/Bar');
            assert.equal(fs.ls().length, 0);

            assert.ok(fs.cd('../..\\Stories').err === undefined);
            assert.equal(fs.fullPath(), '/Stories');
            assert.equal(fs.ls().length, 0);

            assert.ok(fs.cd('../').err === undefined);
            assert.equal(fs.fullPath(), '/');
            assert.equal(fs.ls().length, 3);
        });

        QUnit.test('cd cannot navigate past root', function (assert) {
            var fs = defaultDir();

            assert.ok(fs.cd('../..').err !== undefined);
        });

        QUnit.test('cd cannot navigate to a file', function (assert) {
            var fs = defaultDir();

            assert.ok(fs.cd('foo.txt').err !== undefined);
        });

        QUnit.test('cd cannot navigate to a non-existant directory', function (assert) {
            var fs = defaultDir();

            assert.ok(fs.cd('GooberPea').err !== undefined);
        });
    })();

    (function rmTests() {
        QUnit.module('rm');

        QUnit.test('rm removes files and directories', function (assert) {
            function testRemove(name) {
                var fs = defaultDir();

                assert.ok(fs.find(name).err === undefined);
                assert.ok(fs.rm(name).err === undefined);
                assert.ok(fs.find(name).err !== undefined);
            }

            testRemove('Stories');
            testRemove('foo.txt');
        });
    })();

    (function mkdirTests() {
        QUnit.module('mkdir');

        QUnit.test('mkdir creates a new directory', function (assert) {
            var fs = defaultDir();

            assert.ok(fs.find('Hoi').type === undefined);
            assert.ok(fs.mkdir('Hoi').err === undefined);
            var dir = fs.find('Hoi');
            assert.ok(dir.type === 'd');
            assert.ok(dir.name === 'Hoi');
        });

        QUnit.test('mkdir cannot create an existing directory', function (assert) {
            var fs = defaultDir();

            assert.ok(fs.mkdir('Stories').err !== undefined);
        });
    })();

    (function lsTests () {
        function lsMatches(assert, lsResult, expectedNames) {
            assert.equal(lsResult.length, expectedNames.length);

            for (var i = 0; i < lsResult.length; ++i) {
                assert.equal(lsResult[i].name, expectedNames[i]);
            }
        }

        QUnit.module('ls');

        QUnit.test('ls lists root when on root', function (assert) {
            var fs = defaultDir();

            lsMatches(assert, fs.ls(), ['My Docs', 'Stories', 'foo.txt']);
        });
        
        QUnit.test('ls sorts results', function (assert) {
            var fs = defaultDir();
            fs.cd('My Docs');

            lsMatches(assert, fs.ls(), ['Bar', 'aa.a', 'aha.txt']);
        });
    })();
})();
