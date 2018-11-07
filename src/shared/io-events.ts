namespace Events {

	export interface Change {
		prop: Array<string>,
		value: any
	};

	export interface Changes extends Array<Change> {}

	export interface Initialize extends Array<any> {}

	export function eventNames (eventPrefix : string) {
		const prefix = eventPrefix + ':';
		return {
			initialize: prefix + 'init',
			changes: prefix + 'changes'
		};
	}

	export function convertChanges (changes : Array<{prop : string[], oldValue, newValue}>) : Changes {
		var converted : Changes = [];
		changes.forEach (change => {
			converted.push ({
				prop: change.prop,
				value: change.newValue
			});
		});
		return converted;
	}

}

export { Events };
export default Events;
