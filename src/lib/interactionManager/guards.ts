import { CredentialRequest } from 'jolocom-lib/js/interactionTokens/credentialRequest'
import { CredentialResponse } from 'jolocom-lib/js/interactionTokens/credentialResponse'
import { Authentication } from 'jolocom-lib/js/interactionTokens/authentication'
import { CredentialOfferRequest } from 'jolocom-lib/js/interactionTokens/credentialOfferRequest'
import { CredentialOfferResponse } from 'jolocom-lib/js/interactionTokens/credentialOfferResponse'
import { CredentialsReceive } from 'jolocom-lib/js/interactionTokens/credentialsReceive'

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
