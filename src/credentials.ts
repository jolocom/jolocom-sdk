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
import { JolocomLib } from 'jolocom-lib'
import { SignedCredential } from 'jolocom-lib/js/credentials/signedCredential/signedCredential'
import { Agent } from './agent'
import { ObjectKeeper, CredentialMetadataSummary, IdentitySummary } from './types'
import { IResolver } from 'jolocom-lib/js/didMethods/types'
import { validateJsonLd } from 'jolocom-lib/js/linkedData'
import { SDKError, ErrorCode } from './errors'
import { ClaimInterface } from 'cred-types-jolocom-core/types'

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

  summary(): CredentialMetadataSummary {
    return {
      type: this.type[1],
      issuer: this.issuerProfile!,
      renderInfo: {
        renderAs: this.renderAs
      },
      credential: this.definition
    }
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

export class CredentialTypeKeeper
  implements
    ObjectKeeper<
      CredentialType,
      CredentialMetadataSummary,
      CredentialQuery
    > {

  constructor(
    protected credKeeper: CredentialKeeper,
    protected storage: IStorage,
  ) { }

  buildId(issuer: string, credentialType: string | string[]): string {
    if (typeof credentialType === 'string') {
      return `${issuer}${credentialType}`
    }

    return `${issuer}${credentialType[credentialType.length - 1]}`
  }

  getFullCredentialTypeList(credType: string | string[]): string[] {
    if (!credType) throw new Error('credential type required')
    // NOTE: 'VerifiableCredential' currently implied in the lib/protocol
    if (Array.isArray(credType)) {
      if (credType[0] !== 'VerifiableCredential') {
        return ['VerifiableCredential', ...credType]
      } else {
        return credType
      }
    } else {
      return ['VerifiableCredential', credType]
    }
  }

  getByIssuerAndType(issuerDid: string, credType: string | string[]) {
    const fullCredType = this.getFullCredentialTypeList(credType)
    return this.get(this.buildId(issuerDid, fullCredType), issuerDid, fullCredType)
  }

  async get(id: string, issuerDid?: string, fullCredType?: string | string[]) {
    const meta = await this.storage.get.credentialMetadataById(id)
    // NOTE: sometimes there's no issuer data stored...
    issuerDid = issuerDid || meta.issuer?.did
    fullCredType = this.getFullCredentialTypeList(fullCredType || meta.type)

    if (!meta.issuer?.publicProfile) {
      try {
        meta.issuer = await this.storage.get.publicProfile(issuerDid)
      } catch(err) {
        console.error(`could not lookup issuer ${issuerDid}`, err)
        // pass
      }
    }
    return new CredentialType(fullCredType, meta)
  }

  async create(meta: CredentialMetadataSummary) {
    const fullCredType = this.getFullCredentialTypeList(meta.type)
    await this.storage.store.credentialMetadata(meta)
    if (meta.issuer?.publicProfile) {
      await this.storage.store.issuerProfile(meta.issuer)
    }
    return new CredentialType(fullCredType, meta)
  }

  async forCredential(cred: SignedCredential): Promise<CredentialType> {
    return this.getByIssuerAndType(cred.issuer, cred.type)
  }

  async export(query?: CredentialQuery, options?: QueryOptions): Promise<CredentialMetadataSummary[]> {
    const creds = await this.credKeeper.query(query, options)
    const credTypes = await Promise.all(creds.map(c => this.forCredential(c)))
    return credTypes.map(credType => credType.summary())
  }

  async import(data: CredentialMetadataSummary[]): Promise<[CredentialMetadataSummary, SDKError][]> {
    const rejected: [CredentialMetadataSummary, SDKError][]  = []
    await Promise.all(data.map(async credMeta => {
      try {
        await this.create(credMeta)
      } catch (err) {
        console.error("credential metadata import failed", credMeta, err)
        // TODO better error breakdown
        err = err instanceof SDKError ? err : new SDKError(ErrorCode.Unknown, err)
        rejected.push([credMeta, err])
      }
    }))
    return rejected
  }
}

export class CredentialKeeper
  implements
    ObjectKeeper<
      SignedCredential,
      ISignedCredCreationArgs<any>,
      CredentialQuery,
      ISignedCredentialAttrs
    > {

  readonly types: CredentialTypeKeeper

  private _applyFilter: () => CredentialQuery | undefined

  constructor(
    protected storage: IStorage,
    protected resolver: IResolver,
    filter?: CredentialQuery | (() => CredentialQuery),
  ) {
    this.types = new CredentialTypeKeeper(this, this.storage)
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

  async export(query?: CredentialQuery, options?: QueryOptions): Promise<ISignedCredentialAttrs[]> {
    const creds = await this.query(query, options)
    //const credTypes = await Promise.all(creds.map(c => this.getCredentialType(c)))
    //const metas = credTypes.map(credType => credType.summary())

    // NOTE: reversing here to make imports reproduce the same table order
    return creds.reverse().map(c => c.toJSON())
  }

  async import(data: ISignedCredentialAttrs[]): Promise<[ISignedCredentialAttrs, SDKError][]> {
    const rejected: [ISignedCredentialAttrs, SDKError][]  = []
    await Promise.all(data.map(async credJson => {
      try {
        const signer = await this.resolver.resolve(credJson.issuer)
        const cred = await JolocomLib.parseAndValidate.signedCredential(credJson, signer)
        await this.storage.store.verifiableCredential(cred)
      } catch (err) {
        console.error("credential import failed", err)
        // TODO better error breakdown
        err = err instanceof SDKError ? err : new SDKError(ErrorCode.Unknown, err)
        rejected.push([credJson, err])
      }
    }))
    return rejected
  }

  async delete(attrs?: CredentialQuery) {
    // we use this.find to apply the filter if any
    const creds = await this.query(attrs)
    if (creds.length === 0) return false

    await creds.map(({ id }) => this.storage.delete.verifiableCredential(id))
    return true
  }

  async display(cred: SignedCredential): Promise<CredentialDisplay> {
    const credType = await this.types.forCredential(cred)
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
  constructor(
    private agent: Agent,
    filter?: CredentialQuery | (() => CredentialQuery),
  ) {
    super(agent.storage, agent.resolver, filter)
  }

  /**
   * Creates, signs and persists a Credential.
   *
   * @param credParams - credential attributes
   * @returns SignedCredential instance
   * @throws Error on credential claim with 'null' or 'undefined' value
   * @category Credential Management
   */
  async create<T extends BaseMetadata>(credParams: ISignedCredCreationArgs<T>) {
    const credential = await this.issue(credParams)

    await this.persist(credential)

    return credential
  }

  /**
   * Persists signed credential to the storage.
   *
   * @param credential - signed credential
   * @returns void
   * @category Credential Management
   */
  async persist(credential: SignedCredential) {
    // FIXME TODO: issuers currently can't store the cred in their DB because it
    // requires a foreign link to the subject... so only self-signed creds work
    // Otherwise it throws
    if (credential.issuer !== credential.subject) {
      console.warn('Credential persistence. Only self-signed credentials can be stored.')

      return
    }

    await this.storage.store.verifiableCredential(credential)
  }

  /**
   * Creates and signs a Credential.
   *
   * @param credParams - credential attributes
   * @returns SignedCredential instance
   * @throws Error on credential claim with 'null' or 'undefined' value
   * @category Credential Management
   */
  async issue<T extends BaseMetadata>(credParams: ISignedCredCreationArgs<T>) {
    this.assertClaimValueDefined((credParams.claim || {}) as ClaimInterface)

    return await this.agent.idw.create.signedCredential(
      credParams,
      await this.agent.passwordStore.getPassword(),
    )
  }

  private assertClaimValueDefined(claim: object) {
    for (const [key, value] of Object.entries(claim)) {
      if (value === null || value === undefined) {
        throw new Error(`Credential issuance. Claim '${key}' value must be defined.`)
      }
    }
  }
}
