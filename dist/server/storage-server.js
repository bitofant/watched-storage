import { observedStorage, applyChange } from "../shared/observed-storage";
import { Events } from "../shared/io-events";
import { SocketCollection } from "./socket-collection";
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
        return this;
    }
    withAuthorizedSocketIO() {
        this.authorizedSockets = new SocketCollection();
        return this;
    }
    authorizeSocket(socket) {
        if (this.authorizedSockets === null) {
            this.withAuthorizedSocketIO();
        }
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