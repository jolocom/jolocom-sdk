"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSocketTransport = void 0;
const _1 = require(".");
class WebSocketTransport {
    constructor() {
        this.type = _1.ChannelTransportType.WebSockets;
    }
    configure({ WebSocket }) {
        this._WS = WebSocket;
    }
    start(desc, onMessage) {
        if (!this._WS)
            throw new Error('sdk.transports.ws is not configured');
        const ws = new this._WS(desc.config);
        const readyPromise = new Promise((resolve, reject) => {
            let ready = false;
            ws.addEventListener('error', (ev) => {
                if (!ready)
                    reject(ev);
            });
            // TODO check for open errors and reject the promise
            ws.addEventListener('open', (ev) => {
                ready = true;
                resolve();
            });
            ws.addEventListener('close', () => {
                // TODO check for close errors and reject the promise
            });
            ws.addEventListener('message', async (message) => {
                onMessage && onMessage(message.data);
            });
        });
        return {
            // NOTE FIXME should send JSON.stringify??
            send: async (msg) => {
                ws.send(msg);
            },
            ready: readyPromise,
            stop: () => ws.close()
        };
    }
}
exports.WebSocketTransport = WebSocketTransport;
//# sourceMappingURL=websocket.js.map