import { observedStorage, applyChange } from "../shared/observed-storage";
import { Events } from "../shared/io-events";
import { SocketCollection } from "./socket-collection";
import { ObjectID } from "mongodb";
class StorageServer {
    constructor(eventPrefix, data) {
        this.checkIfAccessRestricted = [];
        this.listeners = [];
        this.authorizedSockets = null;
        this.ev = Events.eventNames(eventPrefix);
        this.dataList = observedStorage(this.onChange, data ? data : []);
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
            io.emit(this.ev.changes, Events.convertChanges(changes));
        });
        return this;
    }
    withAuthorizedSocketIO() {
        if (this.authorizedSockets === null) {
            this.authorizedSockets = new SocketCollection();
            this.listeners.push(changes => {
                this.authorizedSockets.emit(this.ev.changes, Events.convertChanges(changes));
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
                    applyChange(this.dataList, change.prop, change.value);
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
                    var id = ObjectID.createFromHexString(objectId);
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
export { StorageServer };
export default StorageServer;
//# sourceMappingURL=storage-server.js.map