"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Events;
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
exports.Events = Events;
exports.default = Events;
//# sourceMappingURL=io-events.js.map