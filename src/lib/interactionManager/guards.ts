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
