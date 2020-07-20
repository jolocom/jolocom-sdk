import {
  CredentialOffer,
  CredentialOfferResponseSelection,
} from 'jolocom-lib/js/interactionTokens/interactionTokens.types'
import { SignedCredential } from 'jolocom-lib/js/credentials/signedCredential/signedCredential'
import { CredentialRequest } from 'jolocom-lib/js/interactionTokens/credentialRequest'
import { CredentialResponse } from 'jolocom-lib/js/interactionTokens/credentialResponse'
import { ChannelTransport } from '../channels'
import { IdentitySummary } from '../types'
import { FlowState } from './flow'
import { EncryptionRequest, DecryptionRequest } from './rpc'

export enum InteractionRole {
  Requester = 'requester',
  Responder = 'responder',
}

// TODO define and refactor how the UI components/containers handle the InteractionSummary.
export interface InteractionSummary {
  initiator: IdentitySummary
  state: FlowState
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
  EstablishChannel = 'EstablishChannel',
  Encrypt = 'Encrypt',
  Decrypt = 'Decrypt',
  Resolution = 'Resolution',
}

export enum EstablishChannelType {
  EstablishChannelRequest = 'EstablishChannelRequest',
  EstablishChannelResponse = 'EstablishChannelResponse',
}
export interface EstablishChannelRequest {
  description: string
  transports: ChannelTransport[]
}
export interface EstablishChannelResponse {
  transportIdx: number
}
export interface EstablishChannelFlowState {
  description: string
  established: boolean
  transports?: ChannelTransport[]
  transport?: ChannelTransport
}

export enum AuthorizationType {
  AuthorizationRequest = 'authorizationRequest',
  AuthorizationResponse = 'authorizationResponse',
}

export enum EncryptionType {
  EncryptionRequest = 'encryptionRequest',
  EncryptionResponse = 'encryptionResponse',
}

export enum DecryptionType {
  DecryptionRequest = 'DecryptionRequest',
  DecryptionResponse = 'DecryptionResponse',
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
  selectedTypes: string[]
  issued: SignedCredential[]
  credentialsValidity: boolean[]
  credentialsAllValid: boolean
}

export interface EncryptionFlowState extends FlowState {
  req: EncryptionRequest
}

export interface DecryptionFlowState extends FlowState {
  req: DecryptionRequest
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
