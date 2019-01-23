import { observedStorage, applyChange } from "../shared/observed-storage";
import { Events } from '../shared/io-events';
function synchronizedStorageClient(sock, eventPrefix) {
    const ev = Events.eventNames(eventPrefix);
    var dontSynchronize = false;
    const dataList = observedStorage(changes => {
        if (dontSynchronize)
            return;
        sock.emit(ev.changes, Events.convertChanges(changes));
    });
    sock.on(ev.changes, (changes) => {
        dontSynchronize = true;
        changes.forEach(change => {
            applyChange(dataList, change.prop, change.value);
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
export default synchronizedStorageClient;
export { synchronizedStorageClient as storageClient };
//# sourceMappingURL=storage-client.js.map