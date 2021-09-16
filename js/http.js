"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HTTPTransport = void 0;
const errors_1 = require("./errors");
const types_1 = require("./types");
const throwFetchNotConfigured = async () => {
    throw new Error('sdk.transports.http is not configured');
};
class HTTPTransport {
    constructor() {
        this.type = types_1.InteractionTransportType.HTTP;
        this._fetch = throwFetchNotConfigured;
    }
    configure({ fetch }) {
        this._fetch = fetch;
    }
    start(desc, onMessage) {
        const { config: callbackURL } = desc;
        return {
            send: async (token) => {
                const response = await this._fetch(callbackURL, {
                    method: 'POST',
                    body: JSON.stringify({ token }),
                    headers: { 'Content-Type': 'application/json' },
                });
                const text = await response.text();
                if (!response.ok) {
                    // TODO Error code for failed send?
                    // TODO Actually include some info about the error
                    throw new errors_1.SDKError(errors_1.ErrorCode.Unknown, new Error(text));
                }
                if (text.length) {
                    let token;
                    try {
                        token = JSON.parse(text).token;
                    }
                    catch (err) {
                    }
                    if (!onMessage || !token) {
                        throw new errors_1.SDKError(errors_1.ErrorCode.Unknown, new Error(text));
                    }
                    await onMessage(token);
                }
            },
        };
    }
}
exports.HTTPTransport = HTTPTransport;
//# sourceMappingURL=http.js.map