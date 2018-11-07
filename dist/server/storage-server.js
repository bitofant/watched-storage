"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const observed_storage_1 = require("../shared/observed-storage");
const io_events_1 = require("../shared/io-events");
function synchronizedStorageServer(io, eventPrefix, listener) {
    const ev = io_events_1.Events.eventNames(eventPrefix);
    const dataList = observed_storage_1.observedStorage(changes => {
        io.emit(ev.changes, io_events_1.Events.convertChanges(changes));
        if (listener)
            listener(changes);
    });
    io.on('connection', socket => {
        socket.emit(ev.initialize, dataList);
        socket.on(ev.changes, (changes) => {
            changes.forEach(change => {
                observed_storage_1.applyChange(dataList, change.prop, change.value);
            });
        });
    });
    return dataList;
}
exports.synchronizedStorageServer = synchronizedStorageServer;
exports.default = synchronizedStorageServer;
//# sourceMappingURL=storage-server.js.map