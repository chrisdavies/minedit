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
                ns.stdout.writeLine(ns.pad('Type', 7) + ' ' + ns.pad('Name', 25));
                ns.stdout.writeLine(ns.pad('----', 7) + ' ' + ns.pad('----', 25));

                for (var i = 0; i < files.length; ++i) {
                    var file = files[i];
                    ns.stdout.writeLine(ns.pad(file.type, 7) + ' ' + files[i].name);
                }
            });
        }
    });


});