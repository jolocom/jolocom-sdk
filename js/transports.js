"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransportKeeper = exports.Transportable = void 0;
const errors_1 = require("./errors");
const http_1 = require("./http");
const websocket_1 = require("./websocket");
class Transportable {
    constructor(transportAPI) {
        this._transportAPI = transportAPI;
    }
    get transportAPI() {
        if (!this._transportAPI)
            throw new Error('no transport');
        return this._transportAPI;
    }
    set transportAPI(api) {
        this._transportAPI = api;
    }
}
exports.Transportable = Transportable;
class TransportKeeper {
    constructor() {
        this.http = new http_1.HTTPTransport();
        this.ws = new websocket_1.WebSocketTransport();
        this._transportHandlers = {
            [this.http.type]: this.http,
            [this.ws.type]: this.ws,
        };
    }
    register(typeName, handler) {
        this._transportHandlers[typeName] = handler;
    }
    /**
     * Start a transport given a {@link TransportDesc} and a
     * {@link TransportMessageHandler}.
     */
    async start(transport, onMessage) {
        const transportHandler = this._transportHandlers[transport.type];
        if (!transportHandler)
            throw new errors_1.SDKError(errors_1.ErrorCode.TransportNotSupported);
        const transportAPI = transportHandler.start(transport, onMessage);
        transportAPI.desc = transport;
        return transportAPI;
    }
}
exports.TransportKeeper = TransportKeeper;
//# sourceMappingURL=transports.js.map