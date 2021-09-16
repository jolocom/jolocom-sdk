import { TransportDesc, TransportMessageHandler, TransportAPI, ChannelTransportType } from '.';
declare type WebSocketEventName = 'open' | 'close' | 'error' | 'message';
interface WebSocket {
    addEventListener(name: WebSocketEventName, handler: (ev: any) => void): void;
    send(data: string): void;
    close(): void;
}
interface WebSocketConstructor {
    new (url: string): WebSocket;
}
export declare class WebSocketTransport {
    type: ChannelTransportType;
    private _WS;
    configure({ WebSocket }: {
        WebSocket: WebSocketConstructor;
    }): void;
    start(desc: TransportDesc, onMessage?: TransportMessageHandler): TransportAPI;
}
export {};
