import { observedStorage, applyChange } from "../shared/observed-storage";
import { Events } from "../shared/io-events";
import { Change } from "../shared/watched-object";
import { SocketCollection } from "./socket-collection";
import { Collection, ObjectID } from "mongodb";



class StorageServer<T> {
	private readonly ev : Events.EventNames;
	public readonly dataList : Array<T>;
	private readonly checkIfAccessRestricted : Array<(socket : SocketIO.Socket, change : Events.Change) => boolean> = [];
	private readonly listeners : Array<(changes: Change[]) => void> = [];
	private authorizedSockets : SocketCollection = null;

	private initializing : boolean = false;

	constructor (eventPrefix : string, data? : Array<T>) {
		this.ev = Events.eventNames(eventPrefix);
		this.dataList = observedStorage (changes => this.onChange(changes), data ? data : []);
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
		this.listeners.push (changes => {
			io.emit (this.ev.changes, Events.convertChanges (changes));
		});
		return this;
	}

	public withAuthorizedSocketIO () : StorageServer<T> {
		if (this.authorizedSockets === null) {
			this.authorizedSockets = new SocketCollection ();
			this.listeners.push (changes => {
				this.authorizedSockets.emit (this.ev.changes, Events.convertChanges (changes));
			});
		}
		return this;
	}

	public authorizeSocket (socket : SocketIO.Socket) : void {
		this.withAuthorizedSocketIO ();
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
		this.checkIfAccessRestricted.push(listener);
		return this;
	}

	private accessGranted (socket : SocketIO.Socket, change : Events.Change) : boolean {
		for (let i = 0, n = this.checkIfAccessRestricted.length; i < n; i++) {
			if (this.checkIfAccessRestricted[i] (socket, change)) return false;
		}
		return true;
	}

	public withMongo (collection : Collection<T>, classLoader? : (dbItem : any) => T) : Promise<StorageServer<T>> {
		const self = this;

		this.listeners.push(changes => {
			if (self.initializing) return;
			changes.forEach(change => {
				var entity = self.dataList[change.prop[0]];
				var objectId = entity['_id'];
				if (objectId) {
					var id = ObjectID.createFromHexString (objectId);
					var copyOfEntity = Object.assign ({ _id: objectId }, entity);
					delete copyOfEntity._id;
					collection.updateOne ({ _id: id }, { $set: copyOfEntity }, (err, result) => {
						if (err) throw err;
						console.log('mongodb::updated::' + result.modifiedCount);
					});
				} else {
					collection.insertOne (entity, (err, result) => {
						if (err) throw err;
						console.log('mongodb::inserted::' + result.insertedCount + ' (_id => ' + result.insertedId.toHexString () + ')');
						Object.assign (entity, { _id: result.insertedId.toHexString() });
					});
				}
			});
		});

		// load data from DB:
		return new Promise<StorageServer<T>> ((resolve, reject) => {
			collection.find().toArray((err, entities) => {
				if (err) {
					reject (err);
					return;
				}
				self.initializing = true;
				entities.forEach(mongoItem => {
					var item = Object.assign({}, mongoItem, { _id: mongoItem['_id'].toHexString() });
					if (classLoader) {
						this.dataList.push (classLoader (item));
					} else {
						this.dataList.push (item);
					}
				});
				process.nextTick (() => {
					self.initializing = false;
					resolve (self);
				});
			});
		});
	}

}



export { StorageServer };
export default StorageServer;
