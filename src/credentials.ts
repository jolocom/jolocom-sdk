import {
  CredentialDefinition,
  CredentialOffer,
  CredentialManifestDisplayMapping,
  ClaimEntry,
  BaseMetadata,
  ISignedCredCreationArgs,
  ISignedCredentialAttrs,
} from '@jolocom/protocol-ts'
import { jsonpath } from './util'
import { QueryOptions, IStorage, CredentialQuery } from './storage'
import { SignedCredential } from 'jolocom-lib/js/credentials/signedCredential/signedCredential'
import { Agent } from './agent'
import { ObjectKeeper } from './types'
import { IResolver } from 'jolocom-lib/js/didMethods/types'
import { validateJsonLd } from 'jolocom-lib/js/linkedData'

export interface DisplayVal {
  label?: string
  key?: string
  value?: string
}

export interface CredentialDisplay {
  type: string
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
  type: string
  def: CredentialDefinition

  constructor(type: string, def: CredentialDefinition) {
    this.type = type
    this.def = def
  }

  display(claim: ClaimEntry): CredentialDisplay {
    const display: CredentialDisplay['display'] = {
      properties: [],
    }

    if (this.def.display) {
      Object.keys(this.def.display).forEach((k) => {
        const val = this.def.display![k]
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
      name: this.def.name || this.type,
      schema: this.def.schema || '',
      display: display,
      styles: {
        ...this.def.styles,
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

  onCreateOffer(offer: CredentialOffer): CredentialOffer {
    const credentialDefaults = { schema: '', name: offer.type }
    return {
      ...offer,
      credential: {
        ...credentialDefaults,
        ...this.def,
        ...offer.credential,
      },
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

  async getCredentialType(cred: SignedCredential): Promise<CredentialType> {
    const vcType = cred.type[1]
    const metadata = await this.storage.get.credentialMetadata(cred)
    return new CredentialType(
      vcType,
      metadata?.credential || ({} as CredentialDefinition),
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
