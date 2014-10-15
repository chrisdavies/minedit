SH.shell.fs = new GDrive('141185055134-7i2slat0itmurhsej47u72ba0tspjhdb.apps.googleusercontent.com');
SH.shell.fs.init().then(function () {
    var ns = SH.shell,
        commands = ns.commands,
        fs = ns.fs,
        stdout = ns.stdout;

    // ls
    commands.add({
        name: 'ls',
        description: 'Lists the contents of the current or specified directory',
        params: [{
            name: 'path',
            description: 'The path to the directory whose contents are to be listed. If not specified, the current directory is used.'
        }],

        execute: function (ctx) {
            var path = ctx.get(1);
            return fs.ls(path).then(function (files) {
                if (files.length) {
                    stdout.writeLine();
                    stdout.writeLine('    Directory: ' + (path || fs.pwd()));
                    stdout.writeLine();
                    stdout.writeLine(stdout.pad('Type', 7) + ' ' + stdout.pad('Name', 25));
                    stdout.writeLine(stdout.pad('----', 7) + ' ' + stdout.pad('----', 25));

                    for (var i = 0; i < files.length; ++i) {
                        var file = files[i];
                        stdout.writeLine(stdout.pad(file.type, 7) + ' ' + files[i].name);
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
            stdout.writeLine(fs.pwd());
        }
    });

    // cd
    commands.add({
        name: 'cd',
        description: 'Change directory to the specified path',
        params: [{
            name: 'path',
            description: 'The path to the directory',
            required: true
        }],

        execute: function (ctx) {
            var path = ctx.get(1);

            return fs.cd(path);
        }
    });

    // mkdir
    commands.add({
        name: 'mkdir',
        description: 'Create the specified directory',
        params: [{
            name: 'path',
            description: 'The path to the directory to be created',
            required: true
        }],

        execute: function (ctx) {
            var path = ctx.get(1);

            return fs.mkdir(path);
        }
    });

    // rm
    commands.add({
        name: 'rm',
        description: 'Remove the specified file or directory',
        params: [{
            name: 'path',
            description: 'The path to the directory that will be removed',
            required: true
        }],

        execute: function (ctx) {
            var path = ctx.get(1);

            return fs.rm(path);
        }
    })
});