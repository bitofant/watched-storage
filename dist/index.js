System.register("shared/watched-object", [], function (exports_1, context_1) {
    "use strict";
    var Change;
    var __moduleName = context_1 && context_1.id;
    function isPrimitive(value, typ) {
        if (!typ)
            typ = typeof (value);
        return typ === 'undefined' || typ === 'string' || typ === 'number' || value === null;
    }
    function watchObject(o, parent, listener) {
        if (o['__watched']) {
            // watcher functions already attached? just add me as a listener...
            o['__watched'].add({ parent, listener });
            return o;
        }
        // no watcher functions attached yet; initialize object!
        var listeners = [{ parent, listener }];
        if (!isPrimitive(o)) {
            for (var k in o) {
                if (!isPrimitive(o[k])) {
                    o[k] = watchObject(o[k], o, change => {
                        change.prop.unshift(k);
                        listeners.forEach(l => l.listener(change));
                    });
                }
            }
        }
        var proxied = new Proxy(o, {
            set: (obj, prop, value) => {
                var oldValue = o[prop];
                var t1 = typeof (oldValue), t2 = typeof (value);
                // don't record implicit changes to array length
                if (prop === 'length' && t1 === 'number' && t2 === 'number' && Array.isArray(o) && oldValue === value) {
                    return Reflect.set(obj, prop, value);
                }
                // remove any listeners from old value
                if (!isPrimitive(oldValue, t1) && oldValue.__watched) {
                    oldValue.__watched.remove(o);
                }
                // add listeners to new value
                if (!isPrimitive(value, t2)) {
                    value = watchObject(value, o, change => {
                        change.prop.unshift(prop);
                        listeners.forEach(l => l.listener(change));
                    });
                }
                listeners.forEach(l => l.listener(new Change(prop, oldValue, value)));
                return Reflect.set(obj, prop, value);
            }
        });
        Object.defineProperty(proxied, '__watched', {
            enumerable: false,
            value: {
                add(parent) {
                    listeners.push(parent);
                },
                remove(parent) {
                    for (var i = 0; i < listeners.length; i++) {
                        if (listeners[i].parent === parent) {
                            listeners.splice(i, 1);
                            return;
                        }
                    }
                }
            }
        });
        return proxied;
    }
    exports_1("watchObject", watchObject);
    return {
        setters: [],
        execute: function () {
            Change = class Change {
                constructor(prop, oldValue, newValue) {
                    this.prop = [prop];
                    this.oldValue = oldValue;
                    this.newValue = newValue;
                }
            };
            exports_1("Change", Change);
            exports_1("default", watchObject);
        }
    };
});
System.register("shared/observed-storage", ["shared/watched-object"], function (exports_2, context_2) {
    "use strict";
    var watched_object_1;
    var __moduleName = context_2 && context_2.id;
    function observedStorage(callback, initialData) {
        var changes = null;
        return watched_object_1.watchObject(initialData || [], null, change => {
            if (changes === null) {
                changes = [change];
                process.nextTick(() => {
                    callback(changes);
                    changes = null;
                });
            }
            else {
                changes.push(change);
            }
        });
    }
    exports_2("observedStorage", observedStorage);
    function applyChange(store, prop, newValue) {
        var o = store;
        for (var i = 0; i < prop.length - 1; i++) {
            o = o[prop[i]];
        }
        o[prop[prop.length - 1]] = newValue;
    }
    exports_2("applyChange", applyChange);
    return {
        setters: [
            function (watched_object_1_1) {
                watched_object_1 = watched_object_1_1;
            }
        ],
        execute: function () {
            exports_2("default", observedStorage);
        }
    };
});
System.register("shared/io-events", [], function (exports_3, context_3) {
    "use strict";
    var Events;
    var __moduleName = context_3 && context_3.id;
    return {
        setters: [],
        execute: function () {
            (function (Events) {
                ;
                function eventNames(eventPrefix) {
                    const prefix = eventPrefix + ':';
                    return {
                        initialize: prefix + 'init',
                        changes: prefix + 'changes'
                    };
                }
                Events.eventNames = eventNames;
                function convertChanges(changes) {
                    var converted = [];
                    changes.forEach(change => {
                        converted.push({
                            prop: change.prop,
                            value: change.newValue
                        });
                    });
                    return converted;
                }
                Events.convertChanges = convertChanges;
            })(Events || (Events = {}));
            exports_3("Events", Events);
            exports_3("default", Events);
        }
    };
});
System.register("server/socket-collection", [], function (exports_4, context_4) {
    "use strict";
    var SocketCollection;
    var __moduleName = context_4 && context_4.id;
    function log(...args) {
        console.log(...args);
    }
    return {
        setters: [],
        execute: function () {
            SocketCollection = class SocketCollection {
                constructor() {
                    this.sockets = [];
                    this.events = {};
                    this.onSocketCountUpdate = null;
                }
                destroy() {
                    for (var ev in this.events) {
                        while (this.events[ev].length > 0) {
                            this.removeListener(ev, this.events[ev][0]);
                        }
                    }
                    this.sockets.forEach(socket => {
                        try {
                            socket.disconnect();
                        }
                        catch (err) { }
                    });
                    this.events = {};
                    this.sockets = [];
                    this.onSocketCountUpdate = null;
                }
                removeSocket(socket) {
                    for (var i = 0; i < this.sockets.length; i++) {
                        if (this.sockets[i] === socket) {
                            this.sockets.splice(i, 1);
                            this.socketCountChanged();
                            return;
                        }
                    }
                }
                socketCountChanged() {
                    if (this.onSocketCountUpdate === null)
                        return;
                    this.onSocketCountUpdate(this.sockets.length);
                }
                add(socket) {
                    this.sockets.push(socket);
                    socket.on('disconnect', () => {
                        this.removeSocket(socket);
                    });
                    for (var k in this.events) {
                        this.events[k].forEach(listener => {
                            socket.on(k, listener);
                        });
                    }
                    this.socketCountChanged();
                }
                on(ev, callback) {
                    if (!this.events[ev])
                        this.events[ev] = [];
                    this.events[ev].push(callback);
                }
                removeListener(ev, callback) {
                    var listeners = this.events[ev];
                    if (!listeners || listeners.length === 0)
                        return;
                    for (var i = listeners.length; i >= 0; i--) {
                        if (listeners[i] === callback) {
                            listeners.splice(i, 1);
                        }
                    }
                    this.sockets.forEach(socket => {
                        try {
                            socket.removeListener(ev, callback);
                            return;
                        }
                        catch (err) {
                            log(err);
                        }
                        try {
                            socket.disconnect();
                        }
                        catch (err) { }
                        this.removeSocket(socket);
                    });
                }
                emit(ev, data) {
                    this.sockets.forEach(socket => {
                        try {
                            socket.emit(ev, data);
                            return;
                        }
                        catch (err) {
                            log(err);
                        }
                        try {
                            socket.disconnect();
                        }
                        catch (err) { }
                        this.removeSocket(socket);
                    });
                }
                ;
            };
            exports_4("SocketCollection", SocketCollection);
            exports_4("default", SocketCollection);
        }
    };
});
System.register("server/storage-server", ["shared/observed-storage", "shared/io-events", "server/socket-collection", "mongodb"], function (exports_5, context_5) {
    "use strict";
    var observed_storage_1, io_events_1, socket_collection_1, mongodb_1, StorageServer;
    var __moduleName = context_5 && context_5.id;
    return {
        setters: [
            function (observed_storage_1_1) {
                observed_storage_1 = observed_storage_1_1;
            },
            function (io_events_1_1) {
                io_events_1 = io_events_1_1;
            },
            function (socket_collection_1_1) {
                socket_collection_1 = socket_collection_1_1;
            },
            function (mongodb_1_1) {
                mongodb_1 = mongodb_1_1;
            }
        ],
        execute: function () {
            StorageServer = class StorageServer {
                constructor(eventPrefix, data) {
                    this.checkIfAccessRestricted = [];
                    this.listeners = [];
                    this.authorizedSockets = null;
                    this.ev = io_events_1.Events.eventNames(eventPrefix);
                    this.dataList = observed_storage_1.observedStorage(this.onChange, data ? data : []);
                }
                onChange(changes) {
                    this.listeners.forEach(listener => {
                        listener(changes);
                    });
                }
                withSocketIO(io) {
                    io.on('connection', socket => {
                        this.initializeSocket(socket);
                    });
                    this.listeners.push(changes => {
                        io.emit(this.ev.changes, io_events_1.Events.convertChanges(changes));
                    });
                    return this;
                }
                withAuthorizedSocketIO() {
                    if (this.authorizedSockets === null) {
                        this.authorizedSockets = new socket_collection_1.SocketCollection();
                        this.listeners.push(changes => {
                            this.authorizedSockets.emit(this.ev.changes, io_events_1.Events.convertChanges(changes));
                        });
                    }
                    return this;
                }
                authorizeSocket(socket) {
                    this.withAuthorizedSocketIO();
                    this.authorizedSockets.add(socket);
                    this.initializeSocket(socket);
                }
                initializeSocket(socket) {
                    socket.emit(this.ev.initialize, this.dataList);
                    socket.on(this.ev.changes, (changes) => {
                        changes.forEach(change => {
                            if (this.accessGranted(socket, change)) {
                                observed_storage_1.applyChange(this.dataList, change.prop, change.value);
                            }
                        });
                    });
                }
                restrictWriteAccess(listener) {
                    this.checkIfAccessRestricted.push(listener);
                    return this;
                }
                accessGranted(socket, change) {
                    for (let i = 0, n = this.checkIfAccessRestricted.length; i < n; i++) {
                        if (this.checkIfAccessRestricted[i](socket, change))
                            return false;
                    }
                    return true;
                }
                withMongo(collection, classLoader) {
                    const self = this;
                    this.listeners.push(changes => {
                        changes.forEach(change => {
                            console.log('changed: ' + change.prop.join('.'));
                            var entity = self.dataList[change.prop[0]];
                            var objectId = entity['_id'];
                            if (objectId) {
                                var id = mongodb_1.ObjectID.createFromHexString(objectId);
                                var copyOfEntity = Object.assign({ _id: objectId }, entity);
                                delete copyOfEntity._id;
                                collection.updateOne({ _id: id }, copyOfEntity, (err, result) => {
                                    if (err)
                                        throw err;
                                    console.log('mongodb::updated::' + result.modifiedCount);
                                });
                            }
                            else {
                                collection.insertOne(entity, (err, result) => {
                                    if (err)
                                        throw err;
                                    console.log('mongodb::inserted::' + result.insertedCount + ' (_id => ' + result.insertedId.toHexString() + ')');
                                    Object.assign(entity, { _id: result.insertedId.toHexString() });
                                });
                            }
                        });
                    });
                    // load data from DB:
                    return new Promise((resolve, reject) => {
                        collection.find().toArray((err, entities) => {
                            if (err) {
                                reject(err);
                                return;
                            }
                            entities.forEach(item => {
                                if (classLoader) {
                                    this.dataList.push(classLoader(item));
                                }
                                else {
                                    this.dataList.push(item);
                                }
                            });
                            resolve(self);
                        });
                    });
                }
            };
            exports_5("StorageServer", StorageServer);
            exports_5("default", StorageServer);
        }
    };
});
System.register("client/storage-client", ["shared/observed-storage", "shared/io-events"], function (exports_6, context_6) {
    "use strict";
    var observed_storage_2, io_events_2;
    var __moduleName = context_6 && context_6.id;
    function synchronizedStorageClient(sock, eventPrefix) {
        const ev = io_events_2.Events.eventNames(eventPrefix);
        var dontSynchronize = false;
        const dataList = observed_storage_2.observedStorage(changes => {
            if (dontSynchronize)
                return;
            sock.emit(ev.changes, io_events_2.Events.convertChanges(changes));
        });
        sock.on(ev.changes, (changes) => {
            dontSynchronize = true;
            changes.forEach(change => {
                observed_storage_2.applyChange(dataList, change.prop, change.value);
            });
            dontSynchronize = false;
        });
        sock.on(ev.initialize, (init) => {
            dontSynchronize = true;
            init.forEach(item => dataList.push(item));
            dontSynchronize = false;
        });
        sock.emit(ev.initialize);
        return dataList;
    }
    exports_6("storageClient", synchronizedStorageClient);
    return {
        setters: [
            function (observed_storage_2_1) {
                observed_storage_2 = observed_storage_2_1;
            },
            function (io_events_2_1) {
                io_events_2 = io_events_2_1;
            }
        ],
        execute: function () {
            exports_6("default", synchronizedStorageClient);
        }
    };
});
System.register("index", ["shared/observed-storage", "server/storage-server", "client/storage-client"], function (exports_7, context_7) {
    "use strict";
    var observed_storage_3, storage_server_1, storage_client_1;
    var __moduleName = context_7 && context_7.id;
    return {
        setters: [
            function (observed_storage_3_1) {
                observed_storage_3 = observed_storage_3_1;
            },
            function (storage_server_1_1) {
                storage_server_1 = storage_server_1_1;
            },
            function (storage_client_1_1) {
                storage_client_1 = storage_client_1_1;
            }
        ],
        execute: function () {
            exports_7("watchedObject", observed_storage_3.default);
            exports_7("storageServer", storage_server_1.default);
            exports_7("storageClient", storage_client_1.default);
            exports_7("default", {
                watchedObject: observed_storage_3.default,
                storageServer: storage_server_1.default,
                storageClient: storage_client_1.default
            });
        }
    };
});
//# sourceMappingURL=index.js.map