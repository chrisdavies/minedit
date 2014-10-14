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
            gapi.client.request({
                'path': 'drive/v2/files/root',
                'method': 'GET',
                'params': {
                    'trashed': 'false'
                }
            }).execute(function (result) {
                p.resolve(result);
            });
        }

        p.then(function (rootFolder) {
            console.log('resolved!!!');
            me.currentPath.push(me.rootFolder = rootFolder);
        });

        return p;
    },

    ls: function () {
        var p = new Plite(),
            dir = this.currentPath[this.currentPath.length - 1],
            request = gapi.client.request({
                'path': 'drive/v2/files',
                'method': 'GET',
                'params': {
                    'trashed': 'false',
                    'q': "'" + dir.id + "' in parents",
                    'maxResults': '100'
                }
            });

        request.execute(function (result) {
            if (result.error) {
                p.reject(result);
            } else {
                p.resolve((result.items || []).map(function (i) {
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
                }));
            }
        });

        return p;
    },

    cd: function (path) {
        var p = new Plite(),
            me = this,
            root = me.rootFolder,
            pieces = path.split(/[\\\/]/).filter(function (p) { return p.length; }),
            currentPath = me.currentPath.slice();

        function resolve() {
            if (currentPath.length) {
                me.currentPath = currentPath;
                p.resolve(currentPath);
            } else {
                p.reject({ err: 'Could not find "' + path + '"' });
            }
        }

        function loadFile(name) {
            me.getFile(name, currentPath[currentPath.length - 1]).then(function (file) {
                currentPath.push(file);
                crawl();
            }).catch(function (err) {
                p.reject(err);
            });
        }

        function crawl() {
            var name = pieces.pop();

            if (!name || !currentPath.length) {
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

    pwd: function () {
        return '/' + this.currentPath.map(function (f) { return f.title; }).join('/');
    },

    mkdir: function (path) {
        var p = new Plite(),
            root = this.rootFolder,
            pieces = path.split(/[\\\/]/).filter(function (p) { return p.length; }),
            currentPath = this.currentPath.slice(),
            me = this;

        function crawl() {
            var name = pieces.shift();

            if (name == '..') {
                currentPath.pop();
            } else {
                var parent = currentPath[currentPath.length - 1];

                function pushFolder(folder) {
                    currentPath.push(folder);

                    if (pieces.length) {
                        crawl();
                    } else {
                        p.resolve(currentPath);
                    }
                }

                me.getFile(name, parent).then(pushFolder).catch(function (err) {
                    // Folder doesn't exist: create it
                    me.createFile(name, parent).then(pushFolder).catch(function (err) {
                        p.reject(err);
                    })
                });
            }
        }

        crawl();

        return p;
    },

    createFile: function (name, parent, mimeType) {
        var p = new Plite();
        console.log('Creating ' + name + ' with parent', parent);
        gapi.client.request({
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
        }).execute(function (result) {
            if (result.error) {
                p.reject({ err: result.error });
            } else {
                p.resolve(result);
            }
        });

        return p;
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

    pushPath: function (dir) {
        this.currentPath.push(dir);
    }
};
