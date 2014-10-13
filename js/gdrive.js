function GDrive(clientId) {
    this.clientId = clientId;
    this.scopes = 'https://www.googleapis.com/auth/drive';
    this.rootFolder;
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
            me.rootFolder = rootFolder;
        });

        return p;
    },

    ls: function (folderId) {
        var p = new Plite(),
            request = gapi.client.request({
                'path': 'drive/v2/files',
                'method': 'GET',
                'params': {
                    'trashed': 'false',
                    'q': "'" + folderId + "' in parents",
                    'maxResults': '100'
                }
            });

        request.execute(function (result) {
            p.resolve(result);
        });

        return p;
    }
};

(function () {
    var drive = new GDrive('141185055134-7i2slat0itmurhsej47u72ba0tspjhdb.apps.googleusercontent.com');

    drive.init().then(function () {
        drive.ls(drive.rootFolder.id).then(function (r) {
            console.log('Got ', r);
            results = r.items;
            for (var i = 0; i < results.length; ++i) {
                console.log(results[i].title);
            }
        });
    })
})();


/*
(function () {
    var CLIENT_ID = '141185055134-7i2slat0itmurhsej47u72ba0tspjhdb.apps.googleusercontent.com',
        SCOPES = 'https://www.googleapis.com/auth/drive';

    function checkAuth() {
        gapi.auth.authorize({
            'client_id': CLIENT_ID,
            'scope': SCOPES,
            'immediate': true
        },
        handleAuthResult);
    }
    

    var rootFolder;

    function ready() {
        var g = new GDrive();
        g.ls(rootFolder.id).then(function (results) {
            for (var i = 0; i < results.length; ++i) {
                console.log(results[i].title);
            }
        });
    }

    function loadOrCreateRootFolder(name) {
        function getRootFolder() {
            var request = gapi.client.request({
                'path': 'drive/v2/files',
                'method': 'GET',
                'params': {
                    'trashed': 'false',
                    'q': "mimeType = 'application/vnd.google-apps.folder' and title = '" + name + "'",
                    'maxResults': '1'
                }
            });

            request.execute(checkRootFolder);
        }

        function checkRootFolder(resp) {
            console.log('Got: ' + resp);
            var result = resp.items;

            if (!result.length) {
                createRootFolder();
            } else {
                rootFolder = result[0];
                ready();
            }
        }

        function createRootFolder() {
            console.log('Creating root folder');
            var request = gapi.client.request({
                'path': 'drive/v2/files',
                'method': 'POST',
                'body': {
                    'title': name,
                    'mimeType': 'application/vnd.google-apps.folder'
                }
            });

            request.execute(printout);

            function printout(result) {
                rootFolder = result;
                ready();
            }
        }

        console.log('getting items');
        getRootFolder();
    }


    function listContents() {
        function getItems() {
            var request = gapi.client.request({
                'path': 'drive/v2/files',
                'method': 'GET',
                'params': {
                    'trashed': 'false',
                    'q': "mimeType = 'application/vnd.google-apps.folder' and title contains 'Hug '",
                    'maxResults': '100'
                }
            });

            request.execute(listItems);
        }

        function listItems(resp) {
            console.log(resp);
            var result = resp.items;
            var i = 0;
            for (i = 0; i < result.length; i++) {
                console.log(result[i].title + ' -- ' + result[i]);
            }
        }

        console.log('getting items');
        getItems();
    }


    function handleAuthResult(authResult) {
        if (authResult && !authResult.error) {
            loadOrCreateRootFolder('Poem');
        } else {
            gapi.auth.authorize({
                'client_id': CLIENT_ID,
                'scope': SCOPES,
                'immediate': false
            },
            handleAuthResult);
        }
    }

    (function (interval) {
        function waitForGapi() {
            if (gapi && gapi.auth) {
                clearInterval(interval);
                console.log('Loading');
                checkAuth();
            }
        }

        interval = setInterval(waitForGapi, 10);
    })();
    
})();
/**/