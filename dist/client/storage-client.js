"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const observed_storage_1 = require("../shared/observed-storage");
const io_events_1 = require("../shared/io-events");
function synchronizedStorageClient(sock, eventPrefix) {
    const ev = io_events_1.Events.eventNames(eventPrefix);
    var dontSynchronize = false;
    const dataList = observed_storage_1.observedStorage(changes => {
        if (dontSynchronize)
            return;
        sock.emit(ev.changes, io_events_1.Events.convertChanges(changes));
    });
    sock.on(ev.changes, (changes) => {
        dontSynchronize = true;
        changes.forEach(change => {
            observed_storage_1.applyChange(dataList, change.prop, change.value);
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
exports.storageClient = synchronizedStorageClient;
exports.default = synchronizedStorageClient;
//# sourceMappingURL=storage-client.js.map