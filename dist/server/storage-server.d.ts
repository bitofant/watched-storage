/// <reference types="socket.io" />
import { Events } from "../shared/io-events";
import { Collection } from "mongodb";
declare class StorageServer<T> {
    private readonly ev;
    readonly dataList: Array<T>;
    private readonly checkIfAccessRestricted;
    private readonly listeners;
    private authorizedSockets;
    private initializing;
    constructor(eventPrefix: string, data?: Array<T>);
    private onChange;
    withSocketIO(io: SocketIO.Server): StorageServer<T>;
    withAuthorizedSocketIO(): StorageServer<T>;
    authorizeSocket(socket: SocketIO.Socket): void;
    private initializeSocket;
    restrictWriteAccess(listener: (socket: SocketIO.Socket, change: Events.Change) => boolean): StorageServer<T>;
    private accessGranted;
    withMongo(collection: Collection<T>, classLoader?: (dbItem: any) => T): Promise<StorageServer<T>>;
}
export { StorageServer };
export default StorageServer;
