import { IdentityWallet } from 'jolocom-lib/js/identityWallet/identityWallet'
import { IStorage, IPasswordStore, NaivePasswordStore } from './lib/storage'
import { SoftwareKeyProvider } from 'jolocom-lib'
import { Identity } from 'jolocom-lib/js/identity/identity'
import { LocalDidMethod } from 'jolocom-lib/js/didMethods/local'
import { BackendError, BackendMiddlewareErrorCodes } from './lib/errors/types'
import { DidMethodKeeper } from './didMethodKeeper'
import { walletUtils } from '@jolocom/native-core'
import { InternalDb } from '@jolocom/local-resolver-registrar/js/db'
import {
  authAsIdentityFromKeyProvider,
  createIdentityFromKeyProvider,
} from 'jolocom-lib/js/didMethods/utils'
import { mnemonicToEntropy } from 'jolocom-lib/js/utils/crypto'
import { IResolver } from 'jolocom-lib/js/didMethods/types'

export class BackendMiddleware {
  private _identityWallet!: IdentityWallet
  private _keyProvider!: SoftwareKeyProvider

  public storageLib: IStorage
  public keyChainLib: IPasswordStore
  public didMethods = new DidMethodKeeper()
  public resolver: IResolver

  public constructor(config: {
    storage: IStorage
    passwordStore?: IPasswordStore
    eventDB?: InternalDb
  }) {
    this.storageLib = config.storage
    this.keyChainLib = config.passwordStore || new NaivePasswordStore()
    const localDidMethod = new LocalDidMethod(
      config.eventDB || this.storageLib.eventDB,
    )
    this.didMethods.register('jun', localDidMethod)
    // FIXME the prefix bit is required just to match IResolver
    // but does anything need it at that level?
    this.resolver = { prefix: '', resolve: this.resolve.bind(this) }
  }

  /**
   * Resolve a DID string such as 'did:jolo:123456789abcdef0' to an Identity
   *
   * @param did string the did to resolve
   * @returns Identity the resolved identity
   */
  public async resolve(did: string): Promise<Identity> {
    return this.storageLib.get
      .didDoc(did)
      .then(ddo => Identity.fromDidDocument({ didDocument: ddo }))
      .catch(async () => {
        const resolved = await this.didMethods
          .getForDid(did)
          .resolver.resolve(did)
        await this.storageLib.store.didDoc(resolved.didDocument).catch(err => {
          console.error('Failed store DID document after resolving', err)
        })
        return resolved
      })
  }

  public get identityWallet(): IdentityWallet {
    if (this._identityWallet) return this._identityWallet
    throw new BackendError(BackendMiddlewareErrorCodes.NoWallet)
  }

  public get keyProvider(): SoftwareKeyProvider {
    if (this._keyProvider) return this._keyProvider
    throw new BackendError(BackendMiddlewareErrorCodes.NoKeyProvider)
  }

  public async loadIdentity(
    did?: string,
    pass?: string,
  ): Promise<IdentityWallet> {
    if (pass) await this.keyChainLib.savePassword(pass)

    const encryptedWalletInfo = await this.storageLib.get.encryptedWallet(did)
    let encryptionPass!: string
    try {
      encryptionPass = pass || (await this.keyChainLib.getPassword())
    } catch (e) {
      // This may fail if the application was uninstalled and reinstalled, as
      // the android keystore is cleared on uninstall, but the database may
      // still remain, due to having been auto backed up!
      // FIXME: Sentry.captureException(e)
    }

    if (encryptedWalletInfo && !encryptionPass) {
      // if we can't decrypt the encryptedWallet, then
      throw new BackendError(BackendError.codes.DecryptionFailed)
    }

    if (!encryptedWalletInfo || !encryptionPass) {
      // If either encryptedWallet or encryptionPass was missing, we throw
      // NoEntropy to signal that we cannot prepare an identityWallet instance due
      // to lack of a wallet.
      // Note that the case of having an encryptionPass but no encryptedWallet
      // is an uncommon edge case, but may potentially happen due to errors/bugs
      // etc
      throw new BackendError(BackendMiddlewareErrorCodes.NoWallet)
    }

    this._keyProvider = new SoftwareKeyProvider(
      walletUtils,
      Buffer.from(encryptedWalletInfo.encryptedWallet, 'base64'),
      encryptedWalletInfo.id,
    )

    const identityWallet = await authAsIdentityFromKeyProvider(
      this._keyProvider,
      encryptionPass,
      this.resolver,
    )

    await this.storageLib.store.didDoc(identityWallet.didDocument)
    return (this._identityWallet = identityWallet)
  }

  public async createNewIdentity(newPass?: string): Promise<IdentityWallet> {
    if (newPass) await this.keyChainLib.savePassword(newPass)
    const pass = newPass || (await this.keyChainLib.getPassword())
    this._keyProvider = await SoftwareKeyProvider.newEmptyWallet(
      walletUtils,
      '',
      pass,
    )
    this._identityWallet = await createIdentityFromKeyProvider(
      this._keyProvider,
      pass,
      this.didMethods.getDefault().registrar,
    )

    await this.storeIdentityData(
      this._identityWallet.identity,
      this._keyProvider,
    )

    return this._identityWallet
  }

  /**
   * Loads an Identity if one is not already instantiated
   *
   * @param did - DID of Identity to be loaded from DB
   * @param newPass - new password to be set, in case the new Wallet has a new Pass
   * @returns Identity An identity corrosponding to the given DID
   */
  public async prepareIdentityWallet(
    did?: string,
    newPass?: string,
  ): Promise<IdentityWallet> {
    if (this._identityWallet) return this._identityWallet

    return this.loadIdentity(did, newPass)
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
    await this.storageLib.store.encryptedWallet({
      id: skp.id,
      encryptedWallet: skp.encryptedWallet,
      timestamp: Date.now(),
    })
    await this.storageLib.store.didDoc(id.didDocument)
  }

  /**
   * Loads an Identity based on a buffer of entropy.
   *
   * @param entropy - Buffer of private entropy to generate keys with
   * @returns An identity corrosponding to the entropy
   */

  public async loadFromMnemonic(
    mnemonic: string,
    newPass?: string,
  ): Promise<IdentityWallet> {
    if (newPass) await this.keyChainLib.savePassword(newPass)
    const pass = newPass || (await this.keyChainLib.getPassword())

    const didMethod = this.didMethods.getDefault()

    if (!didMethod.recoverFromSeed) {
      throw new Error(`Recovery not implemented for method ${didMethod.prefix}`)
    }

    const {
      identityWallet,
      succesfullyResolved,
    } = await didMethod.recoverFromSeed(
      Buffer.from(mnemonicToEntropy(mnemonic), 'hex'),
      pass,
    )

    if (!succesfullyResolved) {
      throw new Error(
        `Identity for did ${identityWallet.did} not anchored, can't load`,
      )
    }

    this._identityWallet = identityWallet
    //@ts-ignore private property, but no other reference present
    this._keyProvider = identityWallet._keyProvider

    await this.storeIdentityData(
      this._identityWallet.identity,
      this._keyProvider,
    )

    return identityWallet
  }

  public async createFromMnemonic(
    mnemonic: string,
    newPass?: string,
    shouldOverwrite?: boolean,
  ): Promise<IdentityWallet> {
    if (newPass) await this.keyChainLib.savePassword(newPass)
    const pass = newPass || (await this.keyChainLib.getPassword())

    const didMethod = this.didMethods.getDefault()

    if (!didMethod.recoverFromSeed) {
      throw new Error(`Recovery not implemented for method ${didMethod.prefix}`)
    }

    const {
      identityWallet,
      succesfullyResolved,
    } = await didMethod.recoverFromSeed(
      Buffer.from(mnemonicToEntropy(mnemonic), 'hex'),
      pass,
    )

    if (!shouldOverwrite && succesfullyResolved) {
      throw new Error(
        `Identity for did ${identityWallet.did} already anchored, and shouldOverwrite? was set to ${shouldOverwrite}`,
      )
    }

    this._identityWallet = identityWallet
    //@ts-ignore private property on idw, but no other reference present
    this._keyProvider = identityWallet._keyProvider

    await didMethod.registrar.create(this.keyProvider, pass)

    await this.storeIdentityData(
      this._identityWallet.identity,
      this._keyProvider,
    )

    return identityWallet
  }
}
