import { CredentialRequest } from 'jolocom-lib/js/interactionTokens/credentialRequest'
import { CredentialResponse } from 'jolocom-lib/js/interactionTokens/credentialResponse'
import { Authentication } from 'jolocom-lib/js/interactionTokens/authentication'
import { CredentialOfferRequest } from 'jolocom-lib/js/interactionTokens/credentialOfferRequest'
import { CredentialOfferResponse } from 'jolocom-lib/js/interactionTokens/credentialOfferResponse'
import { CredentialsReceive } from 'jolocom-lib/js/interactionTokens/credentialsReceive'

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