import { Socket } from "socket.io";
declare function synchronizedStorageClient<T>(sock: Socket, eventPrefix: string): Array<T>;
export default synchronizedStorageClient;
export { synchronizedStorageClient as storageClient };
