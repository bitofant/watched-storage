/// <reference types="socket.io" />
import { Change } from "../shared/watched-object";
declare function synchronizedStorageServer<T>(io: SocketIO.Server, eventPrefix: string, listener?: (changes: Array<Change>) => void): Array<T>;
export { synchronizedStorageServer };
export default synchronizedStorageServer;
