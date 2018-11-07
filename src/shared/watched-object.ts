class Change {
	prop: Array<any>;
	oldValue: any;
	newValue: any;
	constructor (prop : any, oldValue : any, newValue : any) {
		this.prop = [prop];
		this.oldValue = oldValue;
		this.newValue = newValue;
	}
}

interface ParentObject {
	parent: any,
	listener: (change : Change) => void
}

function isPrimitive (value : any, typ? : string) : boolean {
	if (!typ) typ = typeof (value);
	return typ === 'undefined' || typ === 'string' || typ === 'number' || value === null;
}


function watchObject<T extends Object> (o : T, parent : any, listener : (change : Change) => void) : T {
	if (o['__watched']) {
		// watcher functions already attached? just add me as a listener...
		o['__watched'].add ({ parent, listener });
		return o;
	}

	// no watcher functions attached yet; initialize object!
	var listeners : ParentObject[] = [{ parent, listener }];
	if (!isPrimitive (o)) {
		for (var k in o) {
			if (!isPrimitive (o[k])) {
				o[k] = watchObject (o[k], o, change => {
					change.prop.unshift (k);
					listeners.forEach (l => l.listener (change));
				});
			}
		}
	}

	var proxied = new Proxy (o, {
		set: (obj, prop, value) => {
			var oldValue = o[prop];
			var t1 = typeof (oldValue), t2 = typeof (value);
			// don't record implicit changes to array length
			if (prop === 'length' && t1 === 'number' && t2 === 'number' && Array.isArray (o) && oldValue === value) {
				return Reflect.set (obj, prop, value);
			}
			// remove any listeners from old value
			if (!isPrimitive (oldValue, t1) && oldValue.__watched) {
				oldValue.__watched.remove (o);
			}
			// add listeners to new value
			if (!isPrimitive (value, t2)) {
				value = watchObject (value, o, change => {
					change.prop.unshift (prop);
					listeners.forEach (l => l.listener (change));
				});
			}
			listeners.forEach (l => l.listener (new Change (prop, oldValue, value)));
			return Reflect.set (obj, prop, value);
		}
	});

	Object.defineProperty (proxied, '__watched', {
		enumerable: false,
		value: {
			add (parent : ParentObject) {
				listeners.push (parent);
			},
			remove (parent : any) {
				for (var i = 0; i < listeners.length; i++) {
					if (listeners[i].parent === parent) {
						listeners.splice (i, 1);
						return;
					}
				}
			}
		}
	});

	return proxied;
}

export { watchObject, Change };
export default watchObject;
