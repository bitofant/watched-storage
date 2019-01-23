import { watchObject } from "./watched-object";
function observedStorage(callback, initialData) {
    var changes = null;
    return watchObject(initialData || [], null, change => {
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
function applyChange(store, prop, newValue) {
    var o = store;
    for (var i = 0; i < prop.length - 1; i++) {
        o = o[prop[i]];
    }
    o[prop[prop.length - 1]] = newValue;
}
export { observedStorage, applyChange };
export default observedStorage;
//# sourceMappingURL=observed-storage.js.map