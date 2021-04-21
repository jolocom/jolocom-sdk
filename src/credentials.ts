import {
  CredentialDefinition,
  CredentialManifestDisplayMapping,
  ClaimEntry,
  BaseMetadata,
  ISignedCredCreationArgs,
  ISignedCredentialAttrs,
  CredentialRenderTypes,
} from '@jolocom/protocol-ts'
import { jsonpath } from './util'
import { QueryOptions, IStorage, CredentialQuery } from './storage'
import { SignedCredential } from 'jolocom-lib/js/credentials/signedCredential/signedCredential'
import { Agent } from './agent'
import { ObjectKeeper, CredentialMetadataSummary, IdentitySummary } from './types'
import { IResolver } from 'jolocom-lib/js/didMethods/types'
import { validateJsonLd } from 'jolocom-lib/js/linkedData'

export interface DisplayVal {
  label?: string
  key?: string
  value?: string
}

export interface CredentialDisplay {
  type: string[],
  issuerProfile?: IdentitySummary,
  name: string
  schema: string
  styles: CredentialDefinition['styles']
  display: {
    properties: DisplayVal[]
    title?: DisplayVal
    subtitle?: DisplayVal
    description?: DisplayVal
  }
}

// TODO actually move into jolocom-lib??
export class CredentialType {
  public readonly type: string[]
  public readonly renderAs: CredentialRenderTypes
  public readonly issuerProfile?: IdentitySummary
  public readonly definition: CredentialDefinition

  constructor(type: string[], metadata?: CredentialMetadataSummary) {
    this.type = type
    this.definition = metadata?.credential || {} as CredentialDefinition
    // NOTE: support for deprecated 'renderInfo'
    this.renderAs = metadata?.renderInfo?.renderAs || CredentialRenderTypes.claim
    // TODO add check against schema in definition
    this.issuerProfile = metadata?.issuer
  }

  display(claim: ClaimEntry): CredentialDisplay {
    const display: CredentialDisplay['display'] = {
      properties: [],
    }

    if (this.definition.display) {
      Object.keys(this.definition.display).forEach((k) => {
        const val = this.definition.display![k]
        if (Array.isArray(val)) {
          // it's the 'properties' array
          display[k] = val.map((dm) => this._processDisplayMapping(dm, claim))
        } else {
          // one of 'title', 'subtitle', 'description'
          display[k] = this._processDisplayMapping(val, claim)
        }
      })
    }

    return {
      type: this.type,
      issuerProfile: this.issuerProfile,
      name: this.definition.name || this.type.join(", "),
      schema: this.definition.schema || '',
      display: display,
      styles: {
        ...this.definition.styles,
      },
    }
  }

  private _processDisplayMapping(
    dm: CredentialManifestDisplayMapping,
    claim: any,
  ) {
    let value
    const key = claim
      ? dm.path?.find((p) => {
          // the paths are jsonpath
          value = jsonpath(p, claim)
          return value !== undefined
        })
      : undefined

    return {
      label: dm.label,
      key,
      value: value !== undefined ? value : dm.text,
    }
  }
}

export class CredentialKeeper
  implements
    ObjectKeeper<
      SignedCredential,
      ISignedCredCreationArgs<any>,
      CredentialQuery
    > {
  protected storage: IStorage
  protected resolver: IResolver
  private _applyFilter: () => CredentialQuery | undefined

  constructor(
    storage: IStorage,
    resolver: IResolver,
    filter?: CredentialQuery | (() => CredentialQuery),
  ) {
    this.storage = storage
    this.resolver = resolver
    this._applyFilter = typeof filter === 'function' ? filter : () => filter
  }

  /**
   * Retrieves a Signed Credential by id, or throws
   *
   * @param credParams - credential attributes
   * @returns SignedCredential instance
   * @category Credential Management
   */
  async get(id: string): Promise<SignedCredential> {
    const creds = await this.query({ id })
    if (creds.length !== 1)
      throw new Error('multiple results for cred id ' + id)
    return creds[0]
  }

  async query(attrs?: CredentialQuery, options?: QueryOptions): Promise<SignedCredential[]> {
    const filterVals = this._applyFilter()
    return await this.storage.get.verifiableCredential({
      ...attrs,
      ...filterVals,
    })
  }

  async delete(attrs?: CredentialQuery) {
    // we use this.find to apply the filter if any
    const creds = await this.query(attrs)
    if (creds.length === 0) return false

    await creds.map(({ id }) => this.storage.delete.verifiableCredential(id))
    return true
  }

  async storeCredentialType(metadata: CredentialMetadataSummary) {
    await this.storage.store.credentialMetadata(metadata)
    await this.storage.store.issuerProfile(metadata.issuer)
  }

  async getCredentialType(cred: SignedCredential): Promise<CredentialType> {
    const metadata = await this.storage.get.credentialMetadata(cred)

    if (metadata.issuer) {
      try {
        metadata.issuer = await this.storage.get.publicProfile(cred.issuer)
      } catch(err) {
        console.error(`could not lookup issuer ${cred.issuer}`, err)
        // pass
      }
    }

    return new CredentialType(
      cred.type,
      metadata
    )
  }

  async display(cred: SignedCredential): Promise<CredentialDisplay> {
    const credType = await this.getCredentialType(cred)
    return credType.display(cred.claim)
  }

  async verify(
    cred: SignedCredential | ISignedCredentialAttrs,
  ): Promise<boolean> {
    const issuer = await this.resolver.resolve(cred.issuer)
    const json = cred instanceof SignedCredential ? cred.toJSON() : cred
    return validateJsonLd(json, issuer)
  }
}

export class CredentialIssuer extends CredentialKeeper {
  private agent: Agent

  constructor(
    agent: Agent,
    filter?: CredentialQuery | (() => CredentialQuery),
  ) {
    super(agent.storage, agent.resolver, filter)
    this.agent = agent
  }

  /**
   * Creates and signs a Credential, and commits it to storage.
   *
   * @param credParams - credential attributes
   * @returns SignedCredential instance
   * @category Credential Management
   */
  async create<T extends BaseMetadata>(credParams: ISignedCredCreationArgs<T>) {
    const cred = await this.agent.idw.create.signedCredential(
      credParams,
      await this.agent.passwordStore.getPassword(),
    )

    // FIXME TODO: issuers currently can't store the cred in their DB because it
    // requires a foreign link to the subject... so only self-signed creds work
    // Otherwise it throws
    if (cred.issuer === cred.subject) {
      await this.storage.store.verifiableCredential(cred)
    }

    return cred
  }

  issue = this.create
}
