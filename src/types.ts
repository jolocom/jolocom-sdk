import {
  PublicProfileClaimMetadata,
  CredentialDefinition,
} from '@jolocom/protocol-ts'
import {
  CredentialOfferRenderInfo,
  CredentialOfferMetadata,
} from 'jolocom-lib/js/interactionTokens/types'
import { QueryOptions } from './storage'

/**
 * @dev Simply using all claims required by the public profile
 */

export type IssuerPublicProfileSummary = PublicProfileClaimMetadata['claimInterface']

/**
 * @dev An identity summary is composed of a DID + all public info (currently public profile)
 */

export interface IdentitySummary {
  did: string
  publicProfile?: IssuerPublicProfileSummary
}

export interface CredentialMetadataSummary extends CredentialMetadata {
  issuer: IdentitySummary
}

export interface CredentialMetadata {
  type: string
  renderInfo?: CredentialOfferRenderInfo
  metadata?: CredentialOfferMetadata
  credential?: CredentialDefinition
}

/**
 * @category Transports
 */
export interface TransportDesc {
  type: string
  config?: any
}

/**
 * @category Transports
 */
export type TransportMessageHandler = (msg: string) => Promise<void>

/**
 * @category Transports
 */
export interface TransportHandler {
  configure?(...args: any[]): void
  start(d: TransportDesc, cb?: TransportMessageHandler): TransportAPI
}

/**
 * @category Transports
 */
export interface TransportAPI {
  desc?: TransportDesc
  send: (token: string) => Promise<void>
  stop?: () => void
  ready?: Promise<void>
  onMessage?: TransportMessageHandler
}

/**
 * @category Transports
 */
export enum InteractionTransportType {
  QR = 'QR',
  Deeplink = 'Deeplink',
  HTTP = 'HTTP',
  Bluetooth = 'Bluetooth',
  NFC = 'NFC',
}

/**
 * @category Transports
 */
export enum ChannelTransportType {
  WebSockets = 'WebSockets',
}

/**
 * @category Transports
 */
export interface ChannelTransportDesc extends TransportDesc {
  type: ChannelTransportType
}

export interface ObjectKeeper<T, C, Q> {
  get(id: string): Promise<T>
  create?(args: C): Promise<T>
  query?(attrs?: Q, options?: QueryOptions): Promise<T[]>
  update?(obj: T): Promise<boolean>
  delete?(attrs: Q): Promise<boolean>
}

/**
 * @category Delete
 */
export interface DeleteIdentityDataOptions {
  encryptedWallet?: boolean
  identity?: boolean
  credentials?: boolean
  interactions?: boolean
}

export const DEFAULT_DELETE_DATA_OPTIONS: DeleteIdentityDataOptions = {
  encryptedWallet: true,
  identity: true,
  credentials: true,
  interactions: true,
}
