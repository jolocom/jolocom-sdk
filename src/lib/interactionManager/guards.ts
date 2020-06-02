import { CredentialRequest } from 'jolocom-lib/js/interactionTokens/credentialRequest'
import { CredentialResponse } from 'jolocom-lib/js/interactionTokens/credentialResponse'
import { Authentication } from 'jolocom-lib/js/interactionTokens/authentication'
import { CredentialOfferRequest } from 'jolocom-lib/js/interactionTokens/credentialOfferRequest'
import { CredentialOfferResponse } from 'jolocom-lib/js/interactionTokens/credentialOfferResponse'
import { CredentialsReceive } from 'jolocom-lib/js/interactionTokens/credentialsReceive'
import {
  EncryptionRequest,
  EncryptionResponse,
  DecryptionRequest,
  DecryptionResponse,
  CallType,
  Call,
  Result,
  RPC,
} from './rpc'

export const isCredentialRequest = (token: any): token is CredentialRequest =>
  !!(token as CredentialRequest).requestedCredentialTypes

export const isCredentialResponse = (
  token: any,
): token is CredentialResponse => {
  return !!(token as CredentialResponse).suppliedCredentials
}

export const isAuthenticationRequest = (
  token: any,
): token is Authentication => {
  return !!(token as Authentication).description
}

export const isCredentialOfferRequest = (
  token: any,
): token is CredentialOfferRequest =>
  !!(token as CredentialOfferRequest).offeredCredentials

export const isCredentialOfferResponse = (
  token: any,
): token is CredentialOfferResponse =>
  !!(token as CredentialOfferResponse).selectedCredentials

export const isCredentialReceive = (token: any): token is CredentialsReceive =>
  !!(token as CredentialsReceive).signedCredentials

const isRPC = <T extends RPC>(token: any): token is T =>
  typeof token.rpc === 'string'

const isRPCCall = <T>(token: any): token is Call<T> =>
  isRPC<Call<T>>(token) &&
  typeof token.callbackURL === 'string' &&
  !!token.request

const isRPCResult = <T>(token: any): token is Result<T> =>
  isRPC<Result<T>>(token) && !!token.result

export const isEncryptionRequest = (token: any): token is EncryptionRequest =>
  isRPCCall<{ target: string; data: string }>(token) &&
  token.rpc === CallType.AsymEncrypt &&
  typeof token.request.target === 'string' &&
  typeof token.request.data === 'string'

export const isEncryptionResponse = (token: any): token is EncryptionResponse =>
  isRPCResult<string>(token) &&
  token.rpc === CallType.AsymEncrypt &&
  typeof token.result === 'string'

export const isDecryptionRequest = (token: any): token is DecryptionRequest =>
  isRPCCall<string>(token) &&
  token.rpc === CallType.AsymDecrypt &&
  typeof token.request === 'string'

export const isDecryptionResponse = (token: any): token is DecryptionResponse =>
  isRPCResult<string>(token) &&
  token.rpc === CallType.AsymDecrypt &&
  typeof token.result === 'string'
