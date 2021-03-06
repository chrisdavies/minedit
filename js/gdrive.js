﻿'use asm';

// GDrive wraps the Google drive api, providing a more conveient way to manage it
(function (ns) {
    ns.GDrive = function GDrive(clientId) {
        this.clientId = clientId;
        this.scopes = 'https://www.googleapis.com/auth/drive';
        this.rootFolder;
        this.currentPath = [];
    };

    // From mozilla, on how to encode utf8 strings
    function utf8_to_b64(str) {
        return btoa(unescape(encodeURIComponent(str)));
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
                        runAuth();
                    }
                }

                interval = setInterval(waitForGapi, 10);
            })();

            function runAuth() {
                me.authenticate().then(function () {
                    return me._request({
                        'path': 'drive/v2/files/root',
                        'method': 'GET',
                        'params': {
                            'trashed': 'false'
                        }
                    });
                }).then(function (rootFolder) {
                    me.currentPath.push(me.rootFolder = rootFolder);
                    p.resolve(rootFolder);
                }).catch(function (err) {
                    p.reject(err);
                });
            }

            return p;
        },

        authenticate: function () {
            var p = new Plite(),
                me = this;

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
                    p.resolve(authResult);
                } else {
                    gapi.auth.authorize({
                        'client_id': me.clientId,
                        'scope': me.scopes,
                        'immediate': false
                    },
                    handleAuthResult);
                }
            }

            checkAuth();

            return p;
        },

        ls: function (path) {
            var me = this;

            return this._lookupPath(path).then(function (expandedPath) {
                var dir = expandedPath[expandedPath.length - 1];
                return me._request({
                    'path': 'drive/v2/files',
                    'method': 'GET',
                    'params': {
                        'trashed': 'false',
                        'q': "'" + dir.id + "' in parents",
                        'maxResults': '100'
                    }
                });
            }).then(function (result) {
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

            return this._lookupPath(path).then(function (currentPath) {
                me.currentPath = currentPath;
            });
        },

        pwd: function () {
            return '/' + this.currentPath.map(function (f) { return f.title; }).join('/');
        },

        mkdir: function (path) {
            var me = this,
                exists = true;

            function onDirNotFound(name, parent) {
                exists = false;
                return me._createDir(name, parent);
            }

            return me._lookupPath(path, onDirNotFound).then(function () {
                if (exists) {
                    throw { err: '"' + path + '" already exists!' };
                }
            });
        },

        rm: function (path) {
            var me = this;

            return this._lookupPath(path).then(function (expandedPath) {
                var fileToRemove = expandedPath[expandedPath.length - 1];

                return me._request({
                    path: '/drive/v2/files/' + fileToRemove.id,
                    method: 'DELETE'
                });
            });
        },

        mkfile: function (path, content) {
            var me = this,
                p = new Plite();

            function createPathOnNotFound(name, parent, isLeaf) {
                if (!isLeaf) {
                    return me._createDir(name, parent);
                } else {
                    return me._createFile(name, parent, content);
                }
            }

            me._lookupPath(path).then(function () {
                p.reject({ err: 'File "' + path + '" already exists' });
            }).catch(function (err) {
                me._lookupPath(path, createPathOnNotFound).then(function (result) {
                    p.resolve(result[result.length - 1]);
                }).catch(function (err) {
                    p.reject(err);
                })
            });

            return p;
        },

        saveFile: function (fileId, content) {
            return this._updateFile(fileId, content);
        },

        openFile: function (path) {
            return this._lookupPath(path).then(function (fullPath) {
                return fullPath[fullPath.length - 1];
            });
        },

        loadFileContent: function (file) {
            var myToken = gapi.auth.getToken();
            return Alite.get(file.downloadUrl, { 'Authorization': 'Bearer ' + myToken.access_token }).then(function (result) {
                return result.data;
            });
        },

        _writeFile: function (file) {
            const boundary = '-------314159265358979323846',
                delimiter = '\r\n--' + boundary + '\r\n',
                closeDelimiter = '\r\n--' + boundary + '--';

            var contentType = 'text/plain',
                content = file.content || '',
                metadata = {
                    mimeType: contentType
                };

            file.name && (metadata.title = file.name);
            file.parent && (metadata.parents = [{
                kind: 'drive#file',
                id: file.parent.id
            }]);

            var body =
                   delimiter +
                   'Content-Type: application/json\r\n\r\n' +
                   JSON.stringify(metadata) +
                   delimiter +
                   'Content-Type: ' + contentType + '\r\n' +
                   'Content-Transfer-Encoding: base64\r\n' +
                   '\r\n' +
                   utf8_to_b64(content) +
                   closeDelimiter;

            return this._request({
                'path': '/upload/drive/v2/files/' + (file.id || ''),
                'method': file.id ? 'PUT' : 'POST',
                'params': { 'uploadType': 'multipart' },
                'headers': {
                    'Content-Type': 'multipart/mixed; boundary="' + boundary + '"'
                },
                'body': body
            });
        },

        _updateFile: function (id, content) {
            return this._writeFile({
                id: id,
                content: content
            });
        },

        _createFile: function (name, parent, content) {
            return this._writeFile({
                name: name,
                parent: parent,
                content: content
            });
        },

        _createDir: function (name, parent) {
            return this._request({
                path: '/drive/v2/files/',
                method: 'POST',
                body: {
                    title: name,
                    mimeType: 'application/vnd.google-apps.folder',
                    parents: [{
                        kind: 'drive#file',
                        id: parent.id
                    }]
                }
            });
        },

        _getFile: function (name, parent) {
            return this._request({
                'path': 'drive/v2/files',
                'method': 'GET',
                'params': {
                    'trashed': 'false',
                    'q': "title='" + name + "' and '" + parent.id + "' in parents"
                }
            }).then(function (result) {
                if (!result.items || !result.items.length) {
                    throw { err: 'Could not find "' + name + '"' };
                }

                return result.items[0];
            });

            return p;
        },

        _lookupPath: function (path, onDirNotFound) {
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
                    onDirNotFound(name, parent, !pieces.length).then(function (file) {
                        currentPath.push(file);
                        crawl();
                    }).catch(function (err) {
                        p.reject(err);
                    });
                }
            }

            function loadFile(name) {
                var parent = currentPath[currentPath.length - 1];

                me._getFile(name, parent).then(function (file) {
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

        _request: function (req, authAttempt, p) {
            var p = p || new Plite(),
                me = this;

            gapi.client.request(req).execute(function (result) {
                if (result && result.error) {
                    if (result.error.code == 401 && !authAttempt) {
                        me.authenticate().then(function () {
                            return me._request(req, 1, p);
                        });
                    } else {
                        p.reject(result.error);
                    }
                } else {
                    p.resolve(result);
                }
            });

            return p;
        }
    };

})(window);
