import { SoftwareKeyProvider } from 'jolocom-lib'
import { SDKError, ErrorCode } from './errors'
export { SDKError, ErrorCode }

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

export interface IInitAgentOptions {
  //mnemonic?: string
  password?: string
  passwordStore?: IPasswordStore
  did?: string
  auto?: boolean
}

export interface JolocomPlugin {
  register(sdk: JolocomSDK): Promise<void>
}

export class JolocomSDK {
  public didMethods = new DidMethodKeeper()
  public transports = new TransportKeeper()
  public storage: IStorage

  /**
   * The toplevel resolver which simply invokes {@link resolve}
   *
   * @see {@link resolve}
   */
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
    /*
     * Note this is disabled because it breaks metro bundler
     *
    try {
      const WebSocket = require('ws')
      this.transports.ws.configure({ WebSocket })
    } catch (err) {
      // pass, it's ok
    }
    */
  }

  /**
   * Resolve a DID string such as `did:method:123456789abcdef0` to an Identity,
   * looking through storage cache first, then using the appropriate DIDMethod
   * of the {@link DidMethodKeeper}
   *
   * @param did string the did to resolve
   * @returns the resolved identity
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

  /**
   * Create an Agent instance without any identity
   *
   * @param passOrStore - A password as string or {@link IPasswordStore}
   * @param didMethodName - The name of a DID method registered on this Agent's
   *                        SDK instance
   * @category Agent
   */
  public _makeAgent(
    passOrStore?: string | IPasswordStore,
    didMethodName?: string,
  ): Agent {
    const passwordStore = this._makePassStore(passOrStore)
    const didMethod = didMethodName
      ? this.didMethods.get(didMethodName)
      : this.didMethods.getDefault()
    return new Agent({
      sdk: this,
      passwordStore,
      didMethod,
    })
  }

  /**
   * Create an Agent instance with a newly registered Identity, and persist it
   * to storage
   *
   * @param passOrStore - A password as string or {@link IPasswordStore}
   * @param didMethodName - The name of a DID method registered on this Agent's
   *                        SDK instance
   * @category Agent
   */
  public async createAgent(
    passOrStore?: string | IPasswordStore,
    didMethodName?: string,
  ): Promise<Agent> {
    const agent = this._makeAgent(passOrStore, didMethodName)
    await agent.createNewIdentity()
    return agent
  }

  /**
   * Create an Agent instance with a newly registered Identity based on entropy
   * from a BIP39 mnemonic, and persist it to storage
   *
   * @param mnemonic - A BIP39 phrase
   * @param shouldOverwrite - if true, overwrite any pre-existing identity in
   *                          storage (default false)
   * @param passOrStore - A password as string or {@link IPasswordStore}
   * @param didMethodName - DID Method to use, or otherwise
   *                        {@link default | setDefaultDidMethod}
   * @category Agent
   */
  public async createAgentFromMnemonic(
    mnemonic: string,
    shouldOverwrite = false,
    passOrStore?: string | IPasswordStore,
    didMethodName?: string
  ): Promise<Agent> {
    const agent = this._makeAgent(passOrStore, didMethodName)
    await agent.createFromMnemonic(mnemonic, shouldOverwrite)
    return agent
  }


  /**
   * Create an Agent instance with an Identity loaded from storage
   *
   * @param passOrStore - A password as string or {@link IPasswordStore}
   * @param did - The DID of the Agent Identity to load
   * @category Agent
   */
  public async loadAgent(
    passOrStore?: string | IPasswordStore,
    did?: string,
  ): Promise<Agent> {
    const didMethodName = did ? did.split(':')[1] : ''
    const agent = this._makeAgent(passOrStore, didMethodName)
    await agent.loadIdentity(did)
    return agent
  }

  /**
   * Create an Agent instance with an Identity loaded from a mnemonic phrase
   *
   * @param mnemonic - A BIP39 phrase
   * @param passOrStore - A password as string or {@link IPasswordStore}
   * @param didMethodName - DID Method to use, or otherwise
   *                        {@link default | setDefaultDidMethod}
   * @category Agent
   */
  public async loadAgentFromMnemonic(
    mnemonic: string,
    passOrStore?: string | IPasswordStore,
    didMethodName?: string
  ): Promise<Agent> {
    const agent = this._makeAgent(passOrStore, didMethodName)
    await agent.loadFromMnemonic(mnemonic)
    return agent
  }

  /**
   * Create an Agent instance with an Identity loaded from storage or create a
   * new Identity if not found.
   *
   * Note that if the identity is not found a new one will be created ignoring
   * the passed in `did` parameter.
   *
   * @param passOrStore - A password as string or {@link IPasswordStore}
   * @param did - The DID of the Agent Identity to try to load
   * @param auto - whether or not to create a new identity if not found
   *              (default: true)
   * @category Agent
   */
  async initAgent(
    { password, passwordStore, did, auto }: IInitAgentOptions,
  ) {
    const passOrStore = password || passwordStore
    try {
      // NOTE: must 'await' here explicity for error handling to work correctly
      const agent = await this.loadAgent(passOrStore, did)
      return agent
    } catch (err) {
      if (err.message !== ErrorCode.NoWallet || auto === false) {
        throw err
      }
    }
    return this.createAgent(passOrStore)
  }

  /**
   * Attach a plugin to the SDK
   *
   * @NOTE this is for internal use only currently
   */
  async usePlugins(...plugs: JolocomPlugin[]) {
    const promises = plugs.map(p => p.register(this))
    await Promise.all(promises)
  }

  /**
   * Set the default DID method to use for creating/loading agents.
   * Note that it must already have been registered with
   * `sdk.didMethods.register`
   *
   * @category DID Method
   */
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
