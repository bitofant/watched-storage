import { watchObject, Change } from "./watched-object";

function observedStorage<T> (callback : (changes : Change[]) => void) : Array<T> {
	var changes : Change[] = null;
	return watchObject ([], null, change => {
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

function applyChange (store : Array<any>, prop : Array<string>, newValue : any) {
	var o = store;
	for (var i = 0; i < prop.length - 1; i++) {
		o = o[prop[i]];
	}
	o[prop[prop.length - 1]] = newValue;
}

export { observedStorage, applyChange };
export default observedStorage;
