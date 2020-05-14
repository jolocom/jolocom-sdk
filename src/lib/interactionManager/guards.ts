import { JWTEncodable } from 'jolocom-lib/js/interactionTokens/JSONWebToken'
import { CredentialRequest } from 'jolocom-lib/js/interactionTokens/credentialRequest'
import { CredentialResponse } from 'jolocom-lib/js/interactionTokens/credentialResponse'
import { Authentication } from 'jolocom-lib/js/interactionTokens/authentication'
import { CredentialOfferRequest } from 'jolocom-lib/js/interactionTokens/credentialOfferRequest'
import { CredentialOfferResponse } from 'jolocom-lib/js/interactionTokens/credentialOfferResponse'
import { CredentialsReceive } from 'jolocom-lib/js/interactionTokens/credentialsReceive'
import { RPCRequest, RPCResult } from './rpc'

export const isCredentialRequest = (
  token: JWTEncodable,
): token is CredentialRequest =>
  !!(token as CredentialRequest).requestedCredentialTypes

export const isCredentialResponse = (
  token: JWTEncodable,
): token is CredentialResponse => {
  return !!(token as CredentialResponse).suppliedCredentials
}

export const isAuthenticationRequest = (
  token: JWTEncodable,
): token is Authentication => {
  return !!(token as Authentication).description
}

export const isCredentialOfferRequest = (
  token: JWTEncodable,
): token is CredentialOfferRequest =>
  !!(token as CredentialOfferRequest).offeredCredentials

export const isCredentialOfferResponse = (
  token: JWTEncodable,
): token is CredentialOfferResponse =>
  !!(token as CredentialOfferResponse).selectedCredentials

export const isCredentialReceive = (
  token: JWTEncodable,
): token is CredentialsReceive =>
  !!(token as CredentialsReceive).signedCredentials

export const isRPCRequest = (token: JWTEncodable): token is RPCRequest => {
  const t: RPCRequest = token as RPCRequest
  return t.request && t.request.request
}

export const isRPCResponse = (token: JWTEncodable): token is RPCResponse => {
  const t: RPCResponse = token as RPCResponse
  return t.response && t.response.response
}
