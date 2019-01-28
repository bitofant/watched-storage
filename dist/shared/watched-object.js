"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Change {
    constructor(prop, oldValue, newValue) {
        this.prop = [prop];
        this.oldValue = oldValue;
        this.newValue = newValue;
    }
}
exports.Change = Change;
function isPrimitive(value, typ) {
    if (!typ)
        typ = typeof (value);
    return typ === 'undefined' || typ === 'string' || typ === 'number' || typ === 'boolean' || value === null;
}
function watchObject(o, parent, listener) {
    if (typeof (o) === 'function')
        return o;
    if (o['__watched']) {
        // watcher functions already attached? just add me as a listener...
        o['__watched'].add({ parent, listener });
        return o;
    }
    // no watcher functions attached yet; initialize object!
    var listeners = [{ parent, listener }];
    if (!isPrimitive(o)) {
        // console.log ('- watching ' + (typeof (o)) + ':' + JSON.stringify(o));
        // if (!Object.isExtensible(o)) console.log ('  [inextensible]');
        // if (Object.isFrozen(o)) console.log ('  [frozen]');
        // if (Object.isSealed(o)) console.log ('  [sealed]');
        for (var k in o) {
            if (!isPrimitive(o[k])) {
                o[k] = watchObject(o[k], o, change => {
                    change.prop.unshift(k);
                    listeners.forEach(l => l.listener(change));
                });
            }
        }
    }
    var proxied = new Proxy(o, {
        set: (obj, prop, value) => {
            var oldValue = o[prop];
            var t1 = typeof (oldValue), t2 = typeof (value);
            // don't record implicit changes to array length
            if (prop === 'length' && t1 === 'number' && t2 === 'number' && Array.isArray(o) && oldValue === value) {
                return Reflect.set(obj, prop, value);
            }
            // remove any listeners from old value
            if (!isPrimitive(oldValue, t1) && oldValue.__watched) {
                oldValue.__watched.remove(o);
            }
            // add listeners to new value
            if (!isPrimitive(value, t2)) {
                value = watchObject(value, o, change => {
                    change.prop.unshift(prop);
                    listeners.forEach(l => l.listener(change));
                });
            }
            listeners.forEach(l => l.listener(new Change(prop, oldValue, value)));
            return Reflect.set(obj, prop, value);
        }
    });
    Object.defineProperty(proxied, '__watched', {
        enumerable: false,
        value: {
            add(parent) {
                listeners.push(parent);
            },
            remove(parent) {
                for (var i = 0; i < listeners.length; i++) {
                    if (listeners[i].parent === parent) {
                        listeners.splice(i, 1);
                        return;
                    }
                }
            }
        }
    });
    return proxied;
}
exports.watchObject = watchObject;
exports.default = watchObject;
//# sourceMappingURL=watched-object.js.map