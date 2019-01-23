function log(...args) {
    console.log(...args);
}
class SocketCollection {
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
}
export { SocketCollection };
export default SocketCollection;
//# sourceMappingURL=socket-collection.js.map