import { observedStorage, applyChange } from "../shared/observed-storage";
import { Events } from "../shared/io-events";
import { Change } from "../shared/watched-object";
import { SocketCollection } from "./socket-collection";
import { Collection } from "mongodb";



class StorageServer<T> {
	private readonly ev;
	public readonly dataList : Array<T>;
	private readonly checkIfAccessRestricted : Array<(socket : SocketIO.Socket, change : Events.Change) => boolean> = [];
	private readonly listeners : Array<(changes: Change[]) => void> = [];
	private authorizedSockets : SocketCollection = null;

	constructor (eventPrefix : string, data? : Array<T>) {
		this.ev = Events.eventNames(eventPrefix);
		this.dataList = observedStorage (this.onChange, data ? data : []);
	}

	private onChange (changes : Change[]) {
		this.listeners.forEach (listener => {
			listener (changes);
		});
	}

	public withSocketIO (io : SocketIO.Server) : StorageServer<T> {
		io.on('connection', socket => {
			this.initializeSocket (socket);
		});
		return this;
	}

	public withAuthorizedSocketIO () : StorageServer<T> {
		this.authorizedSockets = new SocketCollection ();
		return this;
	}

	public authorizeSocket (socket : SocketIO.Socket) : void {
		if (this.authorizedSockets === null) {
			this.withAuthorizedSocketIO ();
		}
		this.authorizedSockets.add (socket);
		this.initializeSocket (socket);
	}

	private initializeSocket (socket : SocketIO.Socket) {
		socket.emit(this.ev.initialize, this.dataList);

		socket.on(this.ev.changes, (changes: Events.Changes) => { 
			changes.forEach (change => {
				if (this.accessGranted (socket, change)) {
					applyChange(this.dataList, change.prop, change.value);
				}
			});
		});
	}

	public restrictWriteAccess (listener : (socket: SocketIO.Socket, change: Events.Change) => boolean) : StorageServer<T> {
		this.checkIfAccessRestricted.push (listener);
		return this;
	}

	private accessGranted (socket : SocketIO.Socket, change : Events.Change) : boolean {
		for (let i = 0, n = this.checkIfAccessRestricted.length; i < n; i++) {
			if (this.checkIfAccessRestricted[i] (socket, change)) return false;
		}
		return true;
	}

	public withMongo (collection : Collection, classLoader? : (dbItem : any) => T) {
		const self = this;
		return new Promise ((resolve, reject) => {
			collection.find().toArray((err, entities) => {
				if (err) {
					reject (err);
					return;
				}
				entities.forEach(item => {
					if (classLoader) {
						this.dataList.push (classLoader (item));
					} else {
						this.dataList.push (item);
					}
				});
				resolve (self);
			});
		});
	}

}



export { StorageServer };
export default StorageServer;
