import { IdentityWallet } from 'jolocom-lib/js/identityWallet/identityWallet'
import { IStorage, IPasswordStore, NaivePasswordStore } from './lib/storage'
import { JolocomLib } from 'jolocom-lib'
import { publicKeyToDID } from 'jolocom-lib/js/utils/crypto'
import { Identity } from 'jolocom-lib/js/identity/identity'
import { jolocomContractsAdapter } from 'jolocom-lib/js/contracts/contractsAdapter'
import { jolocomContractsGateway } from 'jolocom-lib/js/contracts/contractsGateway'
import { SoftwareKeyProvider } from 'jolocom-lib/js/vaultedKeyProvider/softwareProvider'
import { generateSecureRandomBytes } from './lib/util'
import { BackendError, BackendMiddlewareErrorCodes } from './lib/errors/types'
import { methodKeeper } from 'index'

export class BackendMiddleware {
  private _identityWallet!: IdentityWallet
  private _keyProvider!: SoftwareKeyProvider

  public storageLib: IStorage
  public keyChainLib: IPasswordStore
  public didMethods = methodKeeper()

  private newIdentityPromise!: Promise<IdentityWallet>

  public constructor(config: {
    fuelingEndpoint: string
    storage: IStorage
    passwordStore?: IPasswordStore
  }) {
    // FIXME actually use fuelingEndpoint
    this.storageLib = config.storage
    this.keyChainLib = config.passwordStore || new NaivePasswordStore()
  }

  public get identityWallet(): IdentityWallet {
    if (this._identityWallet) return this._identityWallet
    throw new BackendError(BackendMiddlewareErrorCodes.NoWallet)
  }

  public get keyProvider(): SoftwareKeyProvider {
    if (this._keyProvider) return this._keyProvider
    throw new BackendError(BackendMiddlewareErrorCodes.NoKeyProvider)
  }

  public async prepareIdentityWallet(): Promise<IdentityWallet> {
    if (this._identityWallet) return this._identityWallet

    const encryptedEntropy = await this.storageLib.get.encryptedSeed()
    let encryptionPass
    try {
      encryptionPass = await this.keyChainLib.getPassword()
    } catch (e) {
      // This may fail if the application was uninstalled and reinstalled, as
      // the android keystore is cleared on uninstall, but the database may
      // still remain, due to having been auto backed up!
      // FIXME: Sentry.captureException(e)
    }

    if (encryptedEntropy && !encryptionPass) {
      // if we can't decrypt the encryptedEntropy, then
      // FIXME throw a proper error
      throw new Error('error decrypting database!')
    }

    if (!encryptedEntropy || !encryptionPass) {
      // If either encryptedEntropy or encryptionPass was missing, we throw
      // NoEntropy to signal that we cannot prepare an identityWallet instance due
      // to lack of a seed.
      // Note that the case of having an encryptionPass but no encryptedEntropy
      // is an uncommon edge case, but may potentially happen due to errors/bugs
      // etc
      throw new BackendError(BackendMiddlewareErrorCodes.NoEntropy)
    }

    this._keyProvider = new JolocomLib.KeyProvider(
      Buffer.from(encryptedEntropy, 'hex'),
    )

    const { jolocomIdentityKey: derivationPath } = JolocomLib.KeyTypes

    const userPubKey = this._keyProvider.getPublicKey({
      derivationPath,
      encryptionPass,
    })

    const didDocument = await this.storageLib.get.didDoc(
      publicKeyToDID(userPubKey),
    )

    if (didDocument) {
      const identity = Identity.fromDidDocument({ didDocument })

      // TODO Simplify constructor
      return (this._identityWallet = new IdentityWallet({
        identity,
        vaultedKeyProvider: this._keyProvider,
        publicKeyMetadata: {
          derivationPath,
          keyId: identity.publicKeySection[0].id,
        },
        contractsAdapter: jolocomContractsAdapter,
        contractsGateway: jolocomContractsGateway,
      }))
    } else {
      const identityWallet = await this.didMethods.getDefault().authenticate(
        this._keyProvider,
        {
          encryptionPass,
          derivationPath,
        },
      )

      await this.storageLib.store.didDoc(identityWallet.didDocument)
      return (this._identityWallet = identityWallet)
    }
  }

  /**
   * Loads an Identity based on a BIP 39 12 word seed phrase
   *
   * @param mnemonic - 12 word BIP 39 seed phrase, space-delimited
   * @returns An identity corrosponding to the sead phrase mnemonic
   */
  public async initWithMnemonic(mnemonic: string): Promise<Identity> {
    const password = (await generateSecureRandomBytes(32)).toString('base64')
    this._keyProvider = JolocomLib.KeyProvider.recoverKeyPair(
      mnemonic,
      password,
    ) as SoftwareKeyProvider
    const { jolocomIdentityKey: derivationPath } = JolocomLib.KeyTypes

    const identityWallet = await this.didMethods.getDefault().authenticate(this._keyProvider, {
      encryptionPass: password,
      derivationPath,
    })
    this._identityWallet = identityWallet
    await this.keyChainLib.savePassword(password)
    await this.storeIdentityData()
    return identityWallet.identity
  }

  /*
   * Returns the seed phrase based on a buffer of entropy
   *
   * @param entropy - Buffer of private entropy
   * @returns The seed phrase corresponding to the entropy
   */
  public fromEntropyToMnemonic(entropy: Buffer): string {
    const vkp = JolocomLib.KeyProvider.fromSeed(entropy, 'a')
    return vkp.getMnemonic('a')
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

  public async createKeyProvider(encodedEntropy: string): Promise<void> {
    const password = (await generateSecureRandomBytes(32)).toString('base64')
    this._keyProvider = JolocomLib.KeyProvider.fromSeed(
      Buffer.from(encodedEntropy, 'hex'),
      password,
    )
    await this.keyChainLib.savePassword(password)
  }

  public async fuelKeyWithEther(): Promise<void> {
    const password = await this.keyChainLib.getPassword()
    await JolocomLib.util.fuelKeyWithEther(
      this.keyProvider.getPublicKey({
        encryptionPass: password,
        derivationPath: JolocomLib.KeyTypes.ethereumKey,
      }),
    )
  }

  public async createIdentity(): Promise<IdentityWallet> {
    const password = await this.keyChainLib.getPassword()
    this._identityWallet = await this.didMethods.getDefault().create(
      this.keyProvider,
      password,
    )
    await this.storeIdentityData()
    return this._identityWallet
  }

  private async storeIdentityData(): Promise<void> {
    const personaData = {
      did: this._identityWallet.identity.did,
      controllingKeyPath: JolocomLib.KeyTypes.jolocomIdentityKey,
    }
    await this.storageLib.store.persona(personaData)
    const encryptedSeedData = {
      encryptedEntropy: this.keyProvider.encryptedSeed,
      timestamp: Date.now(),
    }
    await this.storageLib.store.encryptedSeed(encryptedSeedData)
    await this.storageLib.store.didDoc(this._identityWallet.didDocument)
  }

  /**
   * Returns an agent with an Identity provided by a buffer of entropy.
   * WARNING: this registers an identity on the Jolocom DID Method
   *
   * @param seed - Buffer of private entropy to generate keys with
   * @returns An Agent with the identity corrosponding to the seed
   */
  public async createNewIdentity(seed: Buffer): Promise<IdentityWallet> {
    if (this.newIdentityPromise) return this.newIdentityPromise
    return (this.newIdentityPromise = this._createNewIdentity(seed))
  }

  private async _createNewIdentity(seed: Buffer): Promise<IdentityWallet> {
    const encodedEntropy = seed.toString('hex')
    await this.createKeyProvider(encodedEntropy)
    await this.fuelKeyWithEther()
    await this.createIdentity()
    return this.identityWallet
  }
}
