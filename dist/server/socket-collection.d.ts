import { Socket } from 'socket.io';
declare class SocketCollection {
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
