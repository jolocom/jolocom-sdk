"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SDKError = exports.ErrorCode = void 0;
var ErrorCode;
(function (ErrorCode) {
    ErrorCode["Unknown"] = "Unknown";
    ErrorCode["SaveExternalCredentialFailed"] = "SaveExtCred";
    ErrorCode["SaveCredentialMetadataFailed"] = "SaveCredMetadata";
    ErrorCode["TransportNotSupported"] = "UnsuportedTransport";
    ErrorCode["TokenExpired"] = "TokenExpired";
    ErrorCode["InvalidSignature"] = "InvalidSignature";
    ErrorCode["WrongDID"] = "WrongDID";
    ErrorCode["WrongNonce"] = "WrongNonce";
    ErrorCode["WrongFlow"] = "WrongFlow";
    ErrorCode["AuthenticationRequestFailed"] = "AuthRequest";
    ErrorCode["AuthenticationResponseFailed"] = "AuthResponse";
    ErrorCode["CredentialOfferFailed"] = "CredOffer";
    ErrorCode["CredentialsReceiveFailed"] = "CredsReceive";
    ErrorCode["CredentialRequestFailed"] = "CredRequest";
    ErrorCode["CredentialResponseFailed"] = "CredResponse";
    ErrorCode["ParseJWTFailed"] = "ParseJWT";
    ErrorCode["InvalidToken"] = "InvalidToken";
    ErrorCode["NoSuchInteraction"] = "NoSuchInteraction";
    ErrorCode["NoEntropy"] = "NoEntropy";
    ErrorCode["NoPassword"] = "NoPassword";
    ErrorCode["NoKeyProvider"] = "NoKeyProvider";
    ErrorCode["NoWallet"] = "NoWallet";
    ErrorCode["DecryptionFailed"] = "DecryptionFailed";
})(ErrorCode = exports.ErrorCode || (exports.ErrorCode = {}));
class SDKError extends Error {
    constructor(code, origError) {
        super(code);
        this.origError = origError;
    }
}
exports.SDKError = SDKError;
SDKError.codes = ErrorCode;
//# sourceMappingURL=errors.js.map