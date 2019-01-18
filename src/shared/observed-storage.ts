import { watchObject, Change } from "./watched-object";

function observedStorage<T> (callback : (changes : Change[]) => void, initialData? : Array<T>) : Array<T> {
	var changes : Change[] = null;
	return watchObject (initialData || [], null, change => {
		if (changes === null) {
			changes = [change];
			process.nextTick (() => {
				callback (changes);
				changes = null;
			});
		} else {
			changes.push (change);
		}
	});
}

function applyChange<T> (store : Array<T>, prop : Array<string>, newValue : T) {
	var o = store;
	for (var i = 0; i < prop.length - 1; i++) {
		o = o[prop[i]];
	}
	o[prop[prop.length - 1]] = newValue;
}

export { observedStorage, applyChange };
export default observedStorage;
