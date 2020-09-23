import { SoftwareKeyProvider } from 'jolocom-lib'
import { BaseMetadata } from '@jolocom/protocol-ts'
import {
  ICredentialRequest,
  ICredentialRequestAttrs,
  CredentialOffer,
  CredentialOfferRequestAttrs,
  ICredentialsReceiveAttrs,
} from 'jolocom-lib/js/interactionTokens/interactionTokens.types'
import { ISignedCredCreationArgs } from 'jolocom-lib/js/credentials/signedCredential/types'
import { SDKError, ErrorCode } from './errors'
export { SDKError, ErrorCode }

export {
  ICredentialRequest as CredentialRequirements,
  ICredentialRequestAttrs as CredentialRequest,
  CredentialOffer,
  CredentialOfferRequestAttrs,
  ICredentialsReceiveAttrs as CredentialPayload,
  BaseMetadata as CredentialDefinition,
  ISignedCredCreationArgs as CredentialData,
}
import { IStorage, IPasswordStore } from './storage'
export { NaivePasswordStore } from './storage'
export { JolocomLib } from 'jolocom-lib'
export { JSONWebToken } from 'jolocom-lib/js/interactionTokens/JSONWebToken'
import { InternalDb } from '@jolocom/local-resolver-registrar/js/db'
import { DidMethodKeeper } from './didMethodKeeper'
import { LocalDidMethod } from 'jolocom-lib/js/didMethods/local'
import { IResolver } from 'jolocom-lib/js/didMethods/types'
import { Identity } from 'jolocom-lib/js/identity/identity'
import { Agent } from './agent'
import { TransportKeeper } from './transports'
export { Agent } from './agent'

export * from './types'
export { Interaction } from './interactionManager/interaction'
export { FlowType } from './interactionManager/types'

export interface IJolocomSDKConfig {
  storage: IStorage
  eventDB?: InternalDb
}

export interface IJolocomSDKInitOptions {
  did?: string
  mnemonic?: string
  auto?: boolean
  pass?: string
  passOrStore?: string | IPasswordStore
}

export interface JolocomPlugin {
  register(sdk: JolocomSDK): Promise<void>
}

export class JolocomSDK {
  public didMethods = new DidMethodKeeper()
  public transports = new TransportKeeper()
  public storage: IStorage
  public resolver: IResolver

  constructor(conf: IJolocomSDKConfig) {
    this.storage = conf.storage
    const localDidMethod = new LocalDidMethod(
      conf.eventDB || this.storage.eventDB,
    )
    this.didMethods.register('jun', localDidMethod)

    // FIXME the prefix bit is required just to match IResolver
    // but does anything need it at that level?
    this.resolver = { prefix: '', resolve: this.resolve.bind(this) }

    // if we are running on NodeJS, then autoconfig some things if possible
    if (process && process.version) this._autoconfigForNodeJS()
  }

  private _autoconfigForNodeJS() {
    try {
      const fetch = require('node-fetch')
      this.transports.http.configure({ fetch })
    } catch (err) {
      // pass, it's ok
    }
    try {
      const WebSocket = require('ws')
      this.transports.ws.configure({ WebSocket })
    } catch (err) {
      // pass, it's ok
    }
  }

  /**
   * Resolve a DID string such as 'did:jolo:123456789abcdef0' to an Identity
   *
   * @param did string the did to resolve
   * @returns Identity the resolved identity
   */
  public async resolve(did: string): Promise<Identity> {
    return this.storage.get
      .didDoc(did)
      .then(ddo => Identity.fromDidDocument({ didDocument: ddo }))
      .catch(async () => {
        const resolved = await this.didMethods
          .getForDid(did)
          .resolver.resolve(did)
        await this.storage.store.didDoc(resolved.didDocument).catch(err => {
          console.error('Failed store DID document after resolving', err)
        })
        return resolved
      })
  }

  private _makePassStore(passOrStore?: string | IPasswordStore) {
    if (typeof passOrStore === 'string') {
      return { getPassword: async () => passOrStore }
    } else if (passOrStore && passOrStore.getPassword) {
      return passOrStore
    }
    return
  }

  public async createNewAgent(
    passOrStore?: string | IPasswordStore,
    didMethodName?: string,
  ): Promise<Agent> {
    const passwordStore = this._makePassStore(passOrStore)
    const didMethod = didMethodName
      ? this.didMethods.get(didMethodName)
      : this.didMethods.getDefault()
    const agent = new Agent({
      sdk: this,
      passwordStore,
      didMethod,
    })
    await agent.createNewIdentity()
    return agent
  }

  public async loadAgent(
    passOrStore?: string | IPasswordStore,
    did?: string,
  ): Promise<Agent> {
    const didMethodName = did ? did.split(':')[1] : ''
    const didMethod = didMethodName
      ? this.didMethods.get(didMethodName)
      : this.didMethods.getDefault()
    const agent = new Agent({
      sdk: this,
      passwordStore: this._makePassStore(passOrStore),
      didMethod,
    })
    await agent.loadIdentity(did)
    return agent
  }

  // Currently does not handle mnemonic, to avoid complexity.
  // Separate methods are exposed for recovery / identity creation from mnemonic
  async initAgent(
    { passOrStore, did, auto }: IJolocomSDKInitOptions = { auto: true },
  ) {
    try {
      return this.loadAgent(passOrStore, did)
    } catch (err) {
      if (err.message !== ErrorCode.NoWallet || !auto) {
        throw err
      }
    }
    return await this.createNewAgent(passOrStore)
  }

  async usePlugins(...plugs: JolocomPlugin[]) {
    const promises = plugs.map(p => p.register(this))
    await Promise.all(promises)
  }

  setDefaultDidMethod(methodName: string) {
    const method = this.didMethods.get(methodName)
    this.didMethods.setDefault(method)
  }

  /**
   * Stores a DID Document and its corrosponding Key Provider
   *
   * @param id - Identity being Stored
   * @param skp - Key Provider for the Identity
   * @returns void
   */
  public async storeIdentityData(
    id: Identity,
    skp: SoftwareKeyProvider,
  ): Promise<void> {
    if (id.did !== skp.id) throw new Error('Identity data inconsistant')
    await this.storage.store.encryptedWallet({
      id: skp.id,
      encryptedWallet: skp.encryptedWallet,
      timestamp: Date.now(),
    })
    await this.storage.store.didDoc(id.didDocument)
  }
}
