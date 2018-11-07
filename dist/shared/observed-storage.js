"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const watched_object_1 = require("./watched-object");
function observedStorage(callback) {
    var changes = null;
    return watched_object_1.watchObject([], null, change => {
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
exports.observedStorage = observedStorage;
function applyChange(store, prop, newValue) {
    var o = store;
    for (var i = 0; i < prop.length - 1; i++) {
        o = o[prop[i]];
    }
    o[prop[prop.length - 1]] = newValue;
}
exports.applyChange = applyChange;
exports.default = observedStorage;
//# sourceMappingURL=observed-storage.js.map