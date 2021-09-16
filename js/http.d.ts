import { TransportHandler, TransportDesc, TransportMessageHandler, TransportAPI, InteractionTransportType } from './types';
export interface FetchResponse {
    text: () => Promise<string>;
    ok: boolean;
    status: string;
}
export declare type Fetch = (url: string, config?: {
    method: 'GET' | 'POST';
    body: string;
    headers: {
        'Content-Type'?: string;
    };
}) => Promise<FetchResponse>;
export declare class HTTPTransport implements TransportHandler {
    type: InteractionTransportType;
    _fetch: Fetch;
    configure({ fetch }: {
        fetch: Fetch;
    }): void;
    start(desc: TransportDesc, onMessage?: TransportMessageHandler): TransportAPI;
}
