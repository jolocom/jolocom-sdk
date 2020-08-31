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
  Resolution = 'Resolution',
  EstablishChannel = 'EstablishChannel',
  Encrypt = 'Encrypt',
  Decrypt = 'Decrypt',
  Sign = 'Sign',
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
  AuthorizationRequest = 'AuthorizationRequest',
  AuthorizationResponse = 'AuthorizationResponse',
}

export enum EncryptionType {
  EncryptionRequest = 'EncryptionRequest',
  EncryptionResponse = 'EncryptionResponse',
}

export enum DecryptionType {
  DecryptionRequest = 'DecryptionRequest',
  DecryptionResponse = 'DecryptionResponse',
}

export enum SigningType {
  SigningRequest =  'SigningRequest',
  SigningResponse = 'SigningResponse',
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

type RequestMessage<T> = {
  request: T
  callbackURL: string
}

type ResponseMessage<T> = {
  result: T
}

type Base64String = string
type DidDocKeyId = string

export type DecryptionRequest = RequestMessage<{ target: DidDocKeyId, data: Base64String }>
export type DecryptionResponse = ResponseMessage<Base64String>
export type EncryptionRequest = RequestMessage<{ target: DidDocKeyId; data: Base64String }>
export type EncryptionResponse = ResponseMessage<Base64String>
export type SigningRequest = RequestMessage<{ target: DidDocKeyId; data: Base64String }>
export type SigningResponse = ResponseMessage<Base64String>
