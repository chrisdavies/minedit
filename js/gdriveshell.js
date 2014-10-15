SH.shell.fs = new GDrive('141185055134-7i2slat0itmurhsej47u72ba0tspjhdb.apps.googleusercontent.com');
SH.shell.fs.init().then(function () {
    var ns = SH.shell,
        commands = ns.commands,
        fs = ns.fs;

    // ls
    commands.add({
        name: 'ls',
        optional: ['path'],
        description: 'Lists the contents of the current or specified directory',

        execute: function (ctx) {
            var path = ctx.get(1);
            return fs.ls(path).then(function (files) {
                if (files.length) {
                    ns.stdout.writeLine();
                    ns.stdout.writeLine('    Directory: ' + fs.pwd());
                    ns.stdout.writeLine();
                    ns.stdout.writeLine(ns.pad('Type', 7) + ' ' + ns.pad('Name', 25));
                    ns.stdout.writeLine(ns.pad('----', 7) + ' ' + ns.pad('----', 25));

                    for (var i = 0; i < files.length; ++i) {
                        var file = files[i];
                        ns.stdout.writeLine(ns.pad(file.type, 7) + ' ' + files[i].name);
                    }
                }
            });
        }
    });

    // pwd
    commands.add({
        name: 'pwd',
        description: 'Display the working directory',

        execute: function () {
            ns.stdout.writeLine(fs.pwd());
        }
    });

    // cd
    commands.add({
        name: 'cd',
        required: ['path'],
        description: 'Change directory to the specified path',

        execute: function (ctx) {
            var path = ctx.get(1);

            return fs.cd(path);
        }
    });

    // mkdir
    commands.add({
        name: 'mkdir',
        required: ['path'],
        description: 'Create the specified directory',

        execute: function (ctx) {
            var path = ctx.get(1);

            return fs.mkdir(path);
        }
    });

    // rm
    commands.add({
        name: 'rm',
        required: ['path'],
        description: 'Remove the specified file or directory',

        execute: function (ctx) {
            var path = ctx.get(1);

            return fs.rm(path);
        }
    })
});