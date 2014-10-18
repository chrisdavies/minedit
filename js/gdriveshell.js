SH.shell.fs = new GDrive('141185055134-7i2slat0itmurhsej47u72ba0tspjhdb.apps.googleusercontent.com');

SH.shell.stdout.writeLine('Connecting to gdrive...');

SH.shell.fs.init().then(function () {
    var ns = SH.shell,
        commands = ns.commands,
        fs = ns.fs,
        stdout = ns.stdout;

    stdout.writeLine('Connected.');

    // ls
    commands.add({
        name: 'ls',
        description: 'Lists the contents of the current or specified directory',
        params: [{
            name: 'path',
            description: 'The path to the directory whose contents are to be listed. If not specified, the current directory is used.'
        }],

        execute: function (args) {
            var path = args.last();
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
            description: 'The path to the directory'
        }],

        execute: function (args) {
            return fs.cd(args.last());
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

        execute: function (args) {
            return fs.mkdir(args.last());
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

        execute: function (args) {
            return fs.rm(args.last());
        }
    });

    // edit
    commands.add({
        name: 'edit',
        description: 'Opens or creates a file and displays it in the editor',
        params: [{
            name: '-c',
            description: 'Creates the file, errors if the file already exists'
        }, {
            name: 'path',
            description: 'The path to the file to be created or opened',
            required: true
        }],

        execute: function (args) {
            var p,
                path = args.last();

            if (args.has('-c')) {
                p = fs.mkfile(path);
            } else {
                p = fs.openFile(path);
            }

            var file;

            return p.then(function (f) {
                file = f;
                return fs.loadFileContent(f);
            }).then(function (content) {
                args.run('file-editor', {
                    file: {
                        name: file.title,
                        id: file.id
                    },
                    content: content
                });
            });
        }
    })
});