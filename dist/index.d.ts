import watchedObject from './shared/observed-storage';
import storageServer from './server/storage-server';
import storageClient from './client/storage-client';
declare const _default: {
    watchedObject: typeof watchedObject;
    storageServer: typeof storageServer;
    storageClient: typeof storageClient;
};
export default _default;
export { watchedObject, storageServer, storageClient };
