import { HTTPTransport } from './http';
import { TransportHandler, TransportDesc, TransportMessageHandler, TransportAPI } from './types';
import { WebSocketTransport } from './websocket';
export declare class Transportable {
    protected _transportAPI?: TransportAPI;
    constructor(transportAPI?: TransportAPI);
    get transportAPI(): TransportAPI;
    set transportAPI(api: TransportAPI);
}
export declare class TransportKeeper {
    private _transportHandlers;
    http: HTTPTransport;
    ws: WebSocketTransport;
    constructor();
    register(typeName: string, handler: TransportHandler): void;
    /**
     * Start a transport given a {@link TransportDesc} and a
     * {@link TransportMessageHandler}.
     */
    start(transport: TransportDesc, onMessage?: TransportMessageHandler): Promise<TransportAPI>;
}
