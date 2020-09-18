export enum ErrorCode {
  Unknown = 'Unknown',

  SaveExternalCredentialFailed = 'SaveExtCred',
  SaveCredentialMetadataFailed = 'SaveCredMetadata',
  TransportNotSupported = 'UnsuportedTransport',

  TokenExpired = 'TokenExpired',
  InvalidSignature = 'InvalidSignature',
  WrongDID = 'WrongDID',
  WrongNonce = 'WrongNonce',
  WrongFlow = 'WrongFlow',

  AuthenticationRequestFailed = 'AuthRequest',
  AuthenticationResponseFailed = 'AuthResponse',

  CredentialOfferFailed = 'CredOffer',
  CredentialsReceiveFailed = 'CredsReceive',
  CredentialRequestFailed = 'CredRequest',
  CredentialResponseFailed = 'CredResponse',
  ParseJWTFailed = 'ParseJWT',

  InvalidToken = 'InvalidToken',

  NoEntropy = 'NoEntropy',
  NoPassword = 'NoPassword',
  NoKeyProvider = 'NoKeyProvider',
  NoWallet = 'NoWallet',
  DecryptionFailed = 'DecryptionFailed',
}

export class SDKError extends Error {
  public static codes = ErrorCode
  public origError?: Error

  public constructor(code: ErrorCode, origError?: Error) {
    super(code)
    this.origError = origError
  }
}
