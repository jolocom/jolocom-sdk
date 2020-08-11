import {
  CredentialOffer,
  CredentialOfferResponseSelection,
} from 'jolocom-lib/js/interactionTokens/interactionTokens.types'
import { SignedCredential } from 'jolocom-lib/js/credentials/signedCredential/signedCredential'
import { IdentitySummary } from '../types'
import { FlowState } from './flow'
import { CredentialRequest } from 'jolocom-lib/js/interactionTokens/credentialRequest'
import { CredentialResponse } from 'jolocom-lib/js/interactionTokens/credentialResponse'

// TODO define and refactor how the UI components/containers handle the InteractionSummary.
export interface InteractionSummary<T extends FlowState> {
  initiator: IdentitySummary
  state: T
}

export enum InteractionTransportType {
  QR = 'QR',
  Deeplink = 'Deeplink',
  HTTP = 'HTTP',
  Bluetooth = 'Bluetooth',
  NFC = 'NFC',
}

export enum FlowType {
  Authentication = 'Authentication',
  CredentialShare = 'CredentialShare',
  CredentialOffer = 'CredentialOffer',
  Authorization = 'Authorization',
}

export enum AuthorizationType {
  AuthorizationRequest = 'authorizationRequest',
  AuthorizationResponse = 'authorizationResponse',
}

export interface AuthorizationResponse {
  description: string
  imageURL?: string
  action?: string
}

export interface AuthorizationRequest extends AuthorizationResponse {
  callbackURL: string
}

export interface AuthorizationFlowState {
  description: string
  imageURL?: string
  action?: string
}

export interface AuthenticationFlowState extends FlowState {
  description: string
}

export interface CredentialRequestFlowState extends FlowState {
  constraints: CredentialRequest[]
  providedCredentials: CredentialResponse[]
}

export interface CredentialOfferFlowState extends FlowState {
  offerSummary: CredentialOffer[]
  selection: CredentialOfferResponseSelection[]
  issued: SignedCredential[]
  credentialsValidity: boolean[]
  credentialsAllValid: boolean
}

export interface CredentialTypeSummary {
  type: string
  values: string[]
  verifications: CredentialVerificationSummary[]
}

export interface CredentialVerificationSummary {
  id: string
  issuer: IdentitySummary
  selfSigned: boolean
  expires: string | undefined | Date
}

export interface AttributeSummary {
  type: string[]
  results: Array<{
    verification: string
    fieldName: string
    values: string[]
  }>
}

export type IssuanceResult = Array<
  SignedCredentialWithMetadata & { validationErrors: ValidationErrorMap }
>

type ValidationErrorMap = {
  invalidIssuer?: boolean
  invalidSubject?: boolean
}

export interface SignedCredentialWithMetadata extends CredentialOffer {
  signedCredential?: SignedCredential
}
