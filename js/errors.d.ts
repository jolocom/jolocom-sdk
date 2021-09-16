export declare enum ErrorCode {
    Unknown = "Unknown",
    SaveExternalCredentialFailed = "SaveExtCred",
    SaveCredentialMetadataFailed = "SaveCredMetadata",
    TransportNotSupported = "UnsuportedTransport",
    TokenExpired = "TokenExpired",
    InvalidSignature = "InvalidSignature",
    WrongDID = "WrongDID",
    WrongNonce = "WrongNonce",
    WrongFlow = "WrongFlow",
    AuthenticationRequestFailed = "AuthRequest",
    AuthenticationResponseFailed = "AuthResponse",
    CredentialOfferFailed = "CredOffer",
    CredentialsReceiveFailed = "CredsReceive",
    CredentialRequestFailed = "CredRequest",
    CredentialResponseFailed = "CredResponse",
    ParseJWTFailed = "ParseJWT",
    InvalidToken = "InvalidToken",
    NoSuchInteraction = "NoSuchInteraction",
    NoEntropy = "NoEntropy",
    NoPassword = "NoPassword",
    NoKeyProvider = "NoKeyProvider",
    NoWallet = "NoWallet",
    DecryptionFailed = "DecryptionFailed"
}
export declare class SDKError extends Error {
    static codes: typeof ErrorCode;
    origError?: Error;
    constructor(code: ErrorCode, origError?: Error);
}
