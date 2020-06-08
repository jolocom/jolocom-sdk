import { CredentialRequest } from 'jolocom-lib/js/interactionTokens/credentialRequest'
import { CredentialResponse } from 'jolocom-lib/js/interactionTokens/credentialResponse'
import { Authentication } from 'jolocom-lib/js/interactionTokens/authentication'
import { CredentialOfferRequest } from 'jolocom-lib/js/interactionTokens/credentialOfferRequest'
import { CredentialOfferResponse } from 'jolocom-lib/js/interactionTokens/credentialOfferResponse'
import { CredentialsReceive } from 'jolocom-lib/js/interactionTokens/credentialsReceive'
import {
  AuthorizationRequest,
  AuthorizationResponse,
  AuthorizationType,
  EstablishChannelResponse,
  EstablishChannelRequest,
  EstablishChannelType,
} from './types'

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
  token instanceof CredentialRequest

export const isCredentialResponse = (token: any): token is CredentialResponse =>
  token instanceof CredentialResponse

export const isAuthenticationRequest = (token: any): token is Authentication =>
  token instanceof Authentication

export const isCredentialOfferRequest = (
  token: any,
): token is CredentialOfferRequest => token instanceof CredentialOfferRequest

export const isCredentialOfferResponse = (
  token: any,
): token is CredentialOfferResponse => token instanceof CredentialOfferResponse

export const isCredentialReceive = (token: any): token is CredentialsReceive =>
  token instanceof CredentialsReceive

export const isAuthorizationRequest = (
  token: any,
  type: AuthorizationType,
): token is AuthorizationRequest =>
  type === AuthorizationType.AuthorizationRequest

export const isAuthorizationResponse = (
  token: any,
  type: AuthorizationType,
): token is AuthorizationResponse =>
  type === AuthorizationType.AuthorizationResponse

export const isEstablishChannelRequest = (
  token: any,
  type: EstablishChannelType
): token is EstablishChannelRequest =>
  type === EstablishChannelType.EstablishChannelRequest

export const isEstablishChannelResponse = (
  token: any,
  type: EstablishChannelType
): token is EstablishChannelResponse =>
  type === EstablishChannelType.EstablishChannelResponse

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
