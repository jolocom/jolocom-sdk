"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_DELETE_AGENT_OPTIONS = exports.DEFAULT_EXPORT_OPTIONS = exports.EXPORT_SCHEMA_VERSION = exports.ChannelTransportType = exports.InteractionTransportType = void 0;
/**
 * @category Transports
 */
var InteractionTransportType;
(function (InteractionTransportType) {
    InteractionTransportType["QR"] = "QR";
    InteractionTransportType["Deeplink"] = "Deeplink";
    InteractionTransportType["HTTP"] = "HTTP";
    InteractionTransportType["Bluetooth"] = "Bluetooth";
    InteractionTransportType["NFC"] = "NFC";
})(InteractionTransportType = exports.InteractionTransportType || (exports.InteractionTransportType = {}));
/**
 * @category Transports
 */
var ChannelTransportType;
(function (ChannelTransportType) {
    ChannelTransportType["WebSockets"] = "WebSockets";
})(ChannelTransportType = exports.ChannelTransportType || (exports.ChannelTransportType = {}));
/**
 * @category Export/Import
 */
exports.EXPORT_SCHEMA_VERSION = "1.0.0";
/**
 * @category Export/Import
 */
exports.DEFAULT_EXPORT_OPTIONS = {
    credentials: true,
    interactions: true
};
/**
 * @category Delete
 */
exports.DEFAULT_DELETE_AGENT_OPTIONS = {
    encryptedWallet: true,
    identity: true,
    credentials: true,
    interactions: true,
};
//# sourceMappingURL=types.js.map