// @NOTE when you add a new ErrorCode, remember to add it to src/locales/strings
export enum ErrorCode {
  Unknown = 'Unknown',
  // actions/account/index
  WalletInitFailed = 'WalletInit',
  SaveClaimFailed = 'SaveClaim',
  SaveExternalCredentialFailed = 'SaveExtCred',
  TransportNotSupported = 'UnsuportedTransport',
  // actions/sso
  DeepLinkUrlNotFound = 'DeepLinkUrlNotFound',
  TokenExpired = 'TokenExpired',
  InvalidSignature = 'InvalidSignature',
  WrongDID = 'WrongDID',
  WrongNonce = 'WrongNonce',
  // actions/sso/authenticationRequest
  AuthenticationRequestFailed = 'AuthRequest',
  AuthenticationResponseFailed = 'AuthResponse',
  // actions/sso/paymentRequest
  PaymentRequestFailed = 'PayRequest',
  PaymentResponseFailed = 'PayResponse',
  // actions/sso/index
  CredentialOfferFailed = 'CredOffer',
  CredentialsReceiveFailed = 'CredsReceive',
  CredentialRequestFailed = 'CredRequest',
  CredentialResponseFailed = 'CredResponse',
  ParseJWTFailed = 'ParseJWT',
  // actions/registration
  RegistrationFailed = 'Registration',

  // ui/generic/appInit
  AppInitFailed = 'AppInitFailed',
}
