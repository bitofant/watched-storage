import { observedStorage, applyChange } from "../shared/observed-storage";
import { Events } from "../shared/io-events";
import { Change } from "../shared/watched-object";


function synchronizedStorageServer<T> (io : SocketIO.Server, eventPrefix : string, listener? : (changes: Array<Change>) => void) : Array<T> {
	const ev = Events.eventNames (eventPrefix);

	const dataList = observedStorage<T> (changes => {
		io.emit (ev.changes, Events.convertChanges (changes));
		if (listener) listener (changes);
	});

	io.on ('connection', socket => {
		socket.emit (ev.initialize, dataList);

		socket.on (ev.changes, (changes : Events.Changes) => {
			changes.forEach (change => {
				applyChange (dataList, change.prop, change.value);
			});
		});
	});

	return dataList;
}

export { synchronizedStorageServer };
export default synchronizedStorageServer;
