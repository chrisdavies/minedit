// File system //////////////////////////////////
function FileSystem(tree) {
    this.root = tree || {};
    this.dir = this.root;

    this.initialize();
}

FileSystem.prototype = {
    initialize: function () {
        function walkTree(fn, node, parent) {
            if (node && node.type == 'd') {
                fn(node, parent);

                if (node.children) {
                    for (var i = 0; i < node.children.length; ++i) {
                        walkTree(fn, node.children[i], node);
                    }
                }
            }
        }

        this.root.children = this.root.children || [];
        this.root.type = 'd';
        this.root.name = '';

        walkTree(function (node, parent) {
            node.$parent = parent;
        }, this.root);
    },

    ls: function () {
        return (this.dir.children || []).sort(function (a, b) {
            if (a.type != b.type) {
                if (a.type == 'd') {
                    return -1;
                } else {
                    return 1;
                }
            }

            if (a.name < b.name) {
                return -1;
            } else {
                return 1;
            }
        });
    },

    mkdir: function (name) {
        name = this.cleanName(name);

        if (!this.find(name).err) {
            return { err: name + ' already exists.' };
        }

        this.dir.children.push({
            type: 'd',
            name: name,
            children: [],
            $parent: this.dir
        });

        return {};
    },

    rm: function (name) {
        name = this.cleanName(name);
        var children = this.dir.children.filter(function (c) { return c.name != name; });
        if (children.length == this.dir.children.length) {
            return { err: 'Could not find ' + name };
        }

        this.dir.children = children;
        return {};
    },

    cd: function (path) {
        var dir = this.find(this.cleanName(path));

        if (dir.err) {
            return dir;
        }

        if (dir.type != 'd') {
            return { err: path + ' is not a directory' };
        }

        return (this.dir = dir);
    },

    cleanName: function (name) {
        return (name || '').trim().replace(/["']/g, '');
    },

    fullPath: function () {
        var path = [],
            node = this.dir;

        while (node) {
            path.push(node.name);
            node = node.$parent;
        }

        return path.reverse().join('/') || '/';
    },

    find: function (path, root) {
        root = root || this.dir;

        var pieces = path.split(/[\\\/]/).filter(function (p) { return p.length; });

        while (root && pieces.length) {
            var name = pieces.shift();

            if (name == '..') {
                root = root.$parent;
            } else if (name != '.') {
                root = this.child(name, root);
            }
        }

        return root || { err: 'Could not find "' + path + '".' };
    },

    child: function (name, root) {
        var result;

        root.children && root.children.some(function (c) {
            if (c.name == name) {
                result = c;
                return true;
            }

            return false;
        });

        return result;
    }
};

/////////////////////////////////////////