import { SignedCredential } from 'jolocom-lib/js/credentials/signedCredential/signedCredential'
import { JSONWebToken } from 'jolocom-lib/js/interactionTokens/JSONWebToken'
import { InternalDb } from '@jolocom/local-resolver-registrar/js/db'

import { IdentitySummary, CredentialMetadataSummary } from '../types'
import { Identity } from 'jolocom-lib/js/identity/identity'

export interface EncryptedSeedAttributes {
  encryptedEntropy: string
  timestamp: number
}

export interface EncryptedWalletAttributes {
  id: string
  encryptedWallet: string
  timestamp: number
}

export interface CredentialQueryAttrs {
  id?: string
  issuer?: string
  subject?: string
  type?: string[]

  /*
   * TODO
  types?: string[][]
  claim?: {
    [key: string]: string | number | boolean | JsonLdObject | JsonLdObject[]
  }
  */
}

export type CredentialQuery = CredentialQueryAttrs | CredentialQueryAttrs[]

export interface QueryOptions {
  skip?: number
  take?: number
  order?: { [k: string]: 'ASC' | 'DESC' }
}

/**
 * @todo IdentitySummary is a UI type, which can always be
 * derived from a DID Doc and Public Profile.
 * Perhaps that's what we should store instead, since those
 * are more generic and can be reused.
 */

export interface IStorageStore {
  setting(key: string, value: any): Promise<void>
  verifiableCredential(vCred: SignedCredential): Promise<void>
  encryptedWallet(args: EncryptedWalletAttributes): Promise<void>
  credentialMetadata(
    credentialMetadata: CredentialMetadataSummary,
  ): Promise<void>
  issuerProfile(issuer: IdentitySummary): Promise<void>
  identity(identity: Identity): Promise<void>
  interactionToken(token: JSONWebToken<any>): Promise<void>
}

export interface InteractionTokenQueryAttrs {
  nonce?: string
  type?: string
  issuer?: string
}
export type InteractionTokenQuery =
  | InteractionTokenQueryAttrs
  | InteractionTokenQueryAttrs[]

export interface InteractionQueryAttrs {
  id?: string
  type?: string
  types?: string[]
  initiator?: string
  responder?: string
}
export type InteractionQuery = InteractionQueryAttrs | InteractionQueryAttrs[]

export interface IStorageGet {
  settingsObject(): Promise<{ [key: string]: any }>
  setting(key: string): Promise<any>
  verifiableCredential(
    query?: CredentialQuery,
    options?: QueryOptions,
  ): Promise<SignedCredential[]>
  encryptedWallet(id?: string): Promise<EncryptedWalletAttributes | null>
  credentialMetadata(
    credential: SignedCredential,
  ): Promise<CredentialMetadataSummary>
  publicProfile(did: string): Promise<IdentitySummary>
  identity(did: string): Promise<Identity | undefined>
  interactionTokens(
    query?: InteractionTokenQuery,
    options?: QueryOptions,
  ): Promise<Array<JSONWebToken<any>>>
  interactionIds(
    query?: InteractionQuery,
    options?: QueryOptions,
  ): Promise<Array<string>>
}

export interface IStorageDelete {
  verifiableCredential(id: string): Promise<void>
  identity(did: string): Promise<void>
  encryptedWallet(did: string): Promise<void>

  verifiableCredentials(query: CredentialQuery): Promise<void>
  interactions(attrs?: InteractionTokenQuery): Promise<void>
}

export interface IStorage {
  get: IStorageGet
  store: IStorageStore
  delete: IStorageDelete
  eventDB: InternalDb
}

export interface IPasswordStore {
  getPassword: () => Promise<string>
}

export class NaivePasswordStore implements IPasswordStore {
  private _pass: string

  constructor() {
    this._pass = 'default_pass'
  }

  public async getPassword() {
    return this._pass
  }
}
