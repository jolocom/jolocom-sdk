import { IdentityWallet } from 'jolocom-lib/js/identityWallet/identityWallet'
import { IStorage, IPasswordStore, NaivePasswordStore } from './lib/storage'
import { SoftwareKeyProvider, IVaultedKeyProvider } from 'jolocom-lib'
import { Identity } from 'jolocom-lib/js/identity/identity'
import { LocalDidMethod } from 'jolocom-lib/js/didMethods/local'
import { BackendError, BackendMiddlewareErrorCodes } from './lib/errors/types'
import { methodKeeper } from '../index'
import { walletUtils } from '@jolocom/native-core'
import { InternalDb } from 'local-did-resolver'
import {
  authAsIdentityFromKeyProvider,
  createIdentityFromKeyProvider,
} from 'jolocom-lib/js/didMethods/utils'

export class BackendMiddleware {
  private _identityWallet!: IdentityWallet
  private _keyProvider!: SoftwareKeyProvider

  public storageLib: IStorage
  public keyChainLib: IPasswordStore
  public didMethods = methodKeeper()

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
    this.didMethods.register('un', localDidMethod)
    this.didMethods.registerDefault(localDidMethod)
  }

  public get identityWallet(): IdentityWallet {
    if (this._identityWallet) return this._identityWallet
    throw new BackendError(BackendMiddlewareErrorCodes.NoWallet)
  }

  public get keyProvider(): IVaultedKeyProvider {
    if (this._keyProvider) return this._keyProvider
    throw new BackendError(BackendMiddlewareErrorCodes.NoKeyProvider)
  }

  public async loadIdentity(
    did?: string,
    pass?: string,
  ): Promise<IdentityWallet> {
    if (pass) await this.keyChainLib.savePassword(pass)

    const encryptedWalletInfo = await this.storageLib.get.encryptedWallet(did)
    let encryptionPass
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
      this.didMethods.getDefault().resolver,
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
   * @returns An identity corrosponding to the given DID
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
   * Loads an Identity based on a BIP 39 12 word seed phrase
   *
   * @param mnemonic - 12 word BIP 39 seed phrase, space-delimited
   * @returns An identity corrosponding to the sead phrase mnemonic
   */
  public async initWithMnemonic(mnemonic: string): Promise<Identity> {
    // const password = (await generateSecureRandomBytes(32)).toString('base64')
    // this._keyProvider = JolocomLib.KeyProvider.recoverKeyPair(
    //   mnemonic,
    //   password,
    // ) as SoftwareKeyProvider
    // const { jolocomIdentityKey: derivationPath } = JolocomLib.KeyTypes

    // const identityWallet = await this.didMethods
    //   .getDefault()
    //   .authenticate(this._keyProvider, {
    //     encryptionPass: password,
    //     derivationPath,
    //   })
    // this._identityWallet = identityWallet
    // await this.keyChainLib.savePassword(password)
    // await this.storeIdentityData()
    // return identityWallet.identity
    throw new Error('Mnemonic Unimplemented')
  }

  /*
   * Returns the seed phrase based on a buffer of entropy
   *
   * @param entropy - Buffer of private entropy
   * @returns The seed phrase corresponding to the entropy
   */
  public fromEntropyToMnemonic(entropy: Buffer): string {
    // const vkp = JolocomLib.KeyProvider.fromSeed(entropy, 'a')
    // return vkp.getMnemonic('a')
    return ''
  }

  /**
   * Loads an Identity based on a buffer of entropy.
   *
   * @param entropy - Buffer of private entropy to generate keys with
   * @returns An identity corrosponding to the entropy
   */
  public async initWithEntropy(entropy: Buffer): Promise<Identity> {
    // this is ugly but it works, is no less unsafe, and was quick
    return this.initWithMnemonic(this.fromEntropyToMnemonic(entropy))
  }

  public async loadIdentityFromMnemonic(mnemonic: string): Promise<Identity> {
    // const password = (await generateSecureRandomBytes(32)).toString('base64')
    // this._keyProvider = JolocomLib.KeyProvider.recoverKeyPair(
    //   mnemonic,
    //   password,
    // ) as SoftwareKeyProvider
    // const { jolocomIdentityKey: derivationPath } = JolocomLib.KeyTypes

    // const identityWallet = await this.registry.authenticate(this._keyProvider, {
    //   encryptionPass: password,
    //   derivationPath,
    // })
    // this._identityWallet = identityWallet
    // await this.keyChainLib.savePassword(password)
    // await this.storeIdentityData()
    // return identityWallet.identity
    throw new Error('Not Implemented')
  }
}
