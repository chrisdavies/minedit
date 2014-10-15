function GDrive(clientId) {
    this.clientId = clientId;
    this.scopes = 'https://www.googleapis.com/auth/drive';
    this.rootFolder;
    this.currentPath = [];
}

GDrive.prototype = {
    init: function () {
        var p = new Plite(),
            me = this;

        // Wait for gapi to load
        (function (interval) {
            function waitForGapi() {
                if (gapi && gapi.auth) {
                    clearInterval(interval);
                    checkAuth();
                }
            }

            interval = setInterval(waitForGapi, 10);
        })();

        // Check authorization
        function checkAuth() {
            gapi.auth.authorize({
                'client_id': me.clientId,
                'scope': me.scopes,
                'immediate': true
            },
            handleAuthResult);
        }

        function handleAuthResult(authResult) {
            if (authResult && !authResult.error) {
                loadRootFolder();
            } else {
                gapi.auth.authorize({
                    'client_id': me.clientId,
                    'scope': me.scopes,
                    'immediate': false
                },
                handleAuthResult);
            }
        }

        // Load the root folder
        function loadRootFolder() {
            me.request({
                'path': 'drive/v2/files/root',
                'method': 'GET',
                'params': {
                    'trashed': 'false'
                }
            }).then(function (rootFolder) {
                me.currentPath.push(me.rootFolder = rootFolder);
                p.resolve(rootFolder);
            }).catch(function (err) {
                p.reject(err);
            });
        }

        return p;
    },

    ls: function (path) {
        var me = this;

        return this.lookupPath(path).then(function (expandedPath) {
            var dir = expandedPath[expandedPath.length - 1];
            return me.request({
                'path': 'drive/v2/files',
                'method': 'GET',
                'params': {
                    'trashed': 'false',
                    'q': "'" + dir.id + "' in parents",
                    'maxResults': '100'
                }
            });
        }).then(function(result) {
            return (result.items || []).map(function (i) {
                return {
                    name: i.title,
                    type: i.mimeType == 'application/vnd.google-apps.folder' ? 'dir' : 'fil',
                    id: i.id
                };
            }).sort(function (a, b) {
                if (a.type != b.type) {
                    if (a.type == 'dir') {
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
        });
    },

    cd: function (path) {
        var me = this;

        return this.lookupPath(path).then(function (currentPath) {
            me.currentPath = currentPath;
        });
    },

    pwd: function () {
        return '/' + this.currentPath.map(function (f) { return f.title; }).join('/');
    },

    mkdir: function (path) {
        var me = this;

        function onDirNotFound(name, parent) {
            return me.createFile(name, parent);
        }

        return me.lookupPath(path, onDirNotFound);
    },

    rm: function (path) {
        var me = this;

        return this.lookupPath(path).then(function (expandedPath) {
            var fileToRemove = expandedPath[expandedPath.length - 1];

            return me.request({
                path: '/drive/v2/files/' + fileToRemove.id,
                method: 'DELETE'
            });
        });
    },

    createFile: function (name, parent, mimeType) {
        return this.request({
            path: '/drive/v2/files/',
            method: 'POST',
            body: {
                title: name,
                mimeType: mimeType || 'application/vnd.google-apps.folder',
                parents: [{
                    kind: 'drive#file',
                    id: parent.id
                }]
            }
        });
    },

    getFile: function (name, parent) {
        var p = new Plite();

        gapi.client.request({
            'path': 'drive/v2/files',
            'method': 'GET',
            'params': {
                'trashed': 'false',
                'q': "title='" + name + "' and '" + parent.id + "' in parents"
            }
        }).execute(function (result) {
            if (!result.items || !result.items.length) {
                p.reject({ err: 'Could not find "' + name + '"' });
            } else {
                p.resolve(result.items[0]);
            }
        });

        return p;
    },

    lookupPath: function (path, onDirNotFound) {
        path = path || '';
        var p = new Plite(),
            me = this,
            root = me.rootFolder,
            pieces = path.split(/[\\\/]/).filter(function (p) { return p.length; }),
            currentPath = me.currentPath.slice();

        function resolve() {
            if (currentPath.length) {
                p.resolve(currentPath);
            } else {
                p.reject({ err: 'Could not find "' + path + '"' });
            }
        }

        function fileLoadError(name, parent, err) {
            if (!onDirNotFound) {
                p.reject(err);
            } else {
                onDirNotFound(name, parent).then(function (file) {
                    currentPath.push(file);
                    crawl();
                }).catch(function (err) {
                    p.reject(err);
                });
            }
        }

        function loadFile(name) {
            var parent = currentPath[currentPath.length - 1];

            me.getFile(name, parent).then(function (file) {
                currentPath.push(file);
                crawl();
            }).catch(function (err) {
                fileLoadError(name, parent, err);
            });
        }

        function crawl() {
            var name = pieces.shift();

            if (name == '.') {
                crawl();
            } else if (!name || !currentPath.length) {
                resolve();
            } else if (name == '..') {
                currentPath.pop();
                crawl();
            } else {
                loadFile(name);
            }
        }

        crawl();

        return p;
    },

    request: function (req) {
        var p = new Plite();

        gapi.client.request(req).execute(function (result) {
            if (result.error) {
                p.reject(result.error);
            } else {
                p.resolve(result);
            }
        });

        return p;
    }
};
