"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const observed_storage_1 = require("../shared/observed-storage");
const io_events_1 = require("../shared/io-events");
const socket_collection_1 = require("./socket-collection");
const mongodb_1 = require("mongodb");
class StorageServer {
    constructor(eventPrefix, data) {
        this.checkIfAccessRestricted = [];
        this.listeners = [];
        this.authorizedSockets = null;
        this.ev = io_events_1.Events.eventNames(eventPrefix);
        this.dataList = observed_storage_1.observedStorage(changes => this.onChange(changes), data ? data : []);
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
}
exports.StorageServer = StorageServer;
exports.default = StorageServer;
//# sourceMappingURL=storage-server.js.map