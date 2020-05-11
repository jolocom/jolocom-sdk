import { plainToClass } from 'class-transformer'

import { SignedCredential } from 'jolocom-lib/js/credentials/signedCredential/signedCredential'
import { DidDocument } from 'jolocom-lib/js/identity/didDocument/didDocument'
import {
  CredentialOfferMetadata,
  CredentialOfferRenderInfo,
} from 'jolocom-lib/js/interactionTokens/interactionTokens.types'
import {
  JWTEncodable,
  JSONWebToken,
} from 'jolocom-lib/js/interactionTokens/JSONWebToken'

import { IdentitySummary } from '../../actions/sso/types'

import { PersonaEntity } from './entities'

export interface PersonaAttributes {
  did: string
  controllingKeyPath: string
}

export interface EncryptedSeedAttributes {
  encryptedEntropy: string
  timestamp: number
}

export interface CredentialMetadataSummary extends CredentialMetadata {
  issuer: IdentitySummary
}

export interface CredentialMetadata {
  type: string
  renderInfo: CredentialOfferRenderInfo
  metadata: CredentialOfferMetadata
}

/**
 * @todo IdentitySummary is a UI type, which can always be
 * derived from a DID Doc and Public Profile.
 * Perhaps that's what we should store instead, since those
 * are more generic and can be reused.
 */


export interface IStorageStore {
  setting(key: string, value: any): Promise<void>
  persona(args: PersonaAttributes): Promise<void>
  verifiableCredential(vCred: SignedCredential): Promise<void>
  encryptedSeedstoreEncryptedSeed(args: EncryptedSeedAttributes): Promise<void>
  credentialMetadata(credentialMetadata: CredentialMetadataSummary): Promise<void>
  issuerProfile(issuer: IdentitySummary): Promise<void>
  didDoc(doc: DidDocument): Promise<void>
  interactionToken(token: JSONWebToken<JWTEncodable>): Promise<void>
}

export interface IStorageGet {
  settingsObject(): Promise<{ [key: string]: any }>
  setting(key: string): Promise<any>
  persona(query?: object): Promise<PersonaEntity[]>
  verifiableCredential(query?: object): Promise<SignedCredential[]>
  // FIXME types
  attributesByType(type: string[]): Promise<{ type: string[], results: any[] }>
  vCredentialsByAttributeValue(attribute: string): Promise<SignedCredential[]>
  encryptedSeed(): Promise<string | null>
  credentialMetadata(credential: SignedCredential): Promise<CredentialMetadataSummary>
  publicProfile(did: string): Promise<IdentitySummary>
  didDoc(did: string): Promise<DidDocument>
  interactionTokens(attrs: {
    nonce?: string
    type?: string
    issuer?: string
  }): Promise<JSONWebToken<JWTEncodable>[]>
}

export interface IStorageDelete {
  verifiableCredential(id: string): Promise<void>
}

export interface IStorage {
  get: IStorageGet
  store: IStorageStore
  delete: IStorageDelete
}
