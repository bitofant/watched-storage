/// <reference types="socket.io" />
declare module "shared/watched-object" {
    class Change {
        prop: Array<any>;
        oldValue: any;
        newValue: any;
        constructor(prop: any, oldValue: any, newValue: any);
    }
    function watchObject<T extends Object>(o: T, parent: any, listener: (change: Change) => void): T;
    export { watchObject, Change };
    export default watchObject;
}
declare module "shared/observed-storage" {
    import { Change } from "shared/watched-object";
    function observedStorage<T>(callback: (changes: Change[]) => void, initialData?: Array<T>): Array<T>;
    function applyChange<T>(store: Array<T>, prop: Array<string>, newValue: T): void;
    export { observedStorage, applyChange };
    export default observedStorage;
}
declare module "shared/io-events" {
    namespace Events {
        interface Change {
            prop: Array<string>;
            value: any;
        }
        interface Changes extends Array<Change> {
        }
        interface Initialize extends Array<any> {
        }
        interface EventNames {
            initialize: string;
            changes: string;
        }
        function eventNames(eventPrefix: string): EventNames;
        function convertChanges(changes: Array<{
            prop: string[];
            oldValue: any;
            newValue: any;
        }>): Changes;
    }
    export { Events };
    export default Events;
}
declare module "server/socket-collection" {
    import { Socket } from 'socket.io';
    class SocketCollection {
        private sockets;
        private events;
        onSocketCountUpdate: (n: number) => void;
        destroy(): void;
        private removeSocket;
        private socketCountChanged;
        add(socket: Socket): void;
        on(ev: string, callback: (...args: Array<any>) => void): void;
        removeListener(ev: string, callback: (...args: Array<any>) => void): void;
        emit(ev: any, data: any): void;
    }
    export { SocketCollection };
    export default SocketCollection;
}
declare module "server/storage-server" {
    import { Events } from "shared/io-events";
    import { Collection } from "mongodb";
    class StorageServer<T> {
        private readonly ev;
        readonly dataList: Array<T>;
        private readonly checkIfAccessRestricted;
        private readonly listeners;
        private authorizedSockets;
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
}
declare module "client/storage-client" {
    import { Socket } from "socket.io";
    function synchronizedStorageClient<T>(sock: Socket, eventPrefix: string): Array<T>;
    export default synchronizedStorageClient;
    export { synchronizedStorageClient as storageClient };
}
declare module "index" {
    import watchedObject from "shared/observed-storage";
    import storageServer from "server/storage-server";
    import storageClient from "client/storage-client";
    const _default: {
        watchedObject: typeof watchedObject;
        storageServer: typeof storageServer;
        storageClient: typeof storageClient;
    };
    export default _default;
    export { watchedObject, storageServer, storageClient };
}
