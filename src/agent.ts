import { IdentityWallet } from 'jolocom-lib/js/identityWallet/identityWallet'
import { IPasswordStore, NaivePasswordStore, IStorage } from './storage'
import { SoftwareKeyProvider, JolocomLib } from 'jolocom-lib'
import { SDKError, ErrorCode } from './errors'
import { walletUtils } from '@jolocom/native-core'
import {
  authAsIdentityFromKeyProvider,
  createIdentityFromKeyProvider,
} from 'jolocom-lib/js/didMethods/utils'
import { mnemonicToEntropy } from 'jolocom-lib/js/utils/crypto'
import { JolocomSDK, JSONWebToken, TransportAPI } from './index'
import { IDidMethod, IResolver } from 'jolocom-lib/js/didMethods/types'
import { InteractionManager } from './interactionManager/interactionManager'
import { ChannelKeeper } from './channels'
import {
  AuthorizationRequest,
  AuthorizationType,
  EstablishChannelRequest,
  EstablishChannelType,
  DecryptionType,
  EncryptionType,
  SigningType,
} from './interactionManager/types'
import { Interaction } from './interactionManager/interaction'
import { ResolutionType } from './interactionManager/resolutionFlow'
import {
  ICredentialRequestAttrs,
  CredentialOfferRequestAttrs,
  ICredentialsReceiveAttrs,
} from 'jolocom-lib/js/interactionTokens/types'
import { BaseMetadata } from '@jolocom/protocol-ts'
import { ISignedCredCreationArgs } from 'jolocom-lib/js/credentials/signedCredential/types'
import { Flow } from './interactionManager/flow'
import { Identity } from 'jolocom-lib/js/identity/identity'

/**
 * The `Agent` class mainly provides an abstraction around the {@link
 * IdentityWallet} and {@link InteractionManager} components. It provides glue
 * code for:
 * - Identities: create and load identities
 * - Interactions: find interactions, and process incoming tokens
 * - Interaction Requests: start interactions by creating a new request message
 * - Credential Issuance: issue credentials
 *
 *
 * The {@link JolocomSDK} has further convenience methods for Agent
 * construction: {@link JolocomSDK.createAgent},
 * {@link JolocomSDK.loadAgent}, {@link JolocomSDK.initAgent}
 */
export class Agent {
  /*
    TODO: use the Keeper pattern
          so we can do sdk.identities.create()
                        sdk.interactions.create()
                        sdk.interactions.find()
                        etc

  identities: IdentityKeeper
  interactions: InteractionKeeper

  */

  public interactionManager = new InteractionManager(this)
  public channels = new ChannelKeeper(this)
  private _identityWallet!: IdentityWallet
  private _keyProvider!: SoftwareKeyProvider

  public passwordStore: IPasswordStore
  public sdk: JolocomSDK

  private _didMethod?: IDidMethod
  public resolve: (did: string) => Promise<Identity>
  public resolver: IResolver
  public storage: IStorage

  public constructor({
    sdk,
    passwordStore,
    didMethod,
  }: {
    sdk: JolocomSDK
    passwordStore?: IPasswordStore
    didMethod?: IDidMethod
  }) {
    this.passwordStore = passwordStore || new NaivePasswordStore()
    this.sdk = sdk
    this._didMethod = didMethod
    this.resolve = this.sdk.resolve.bind(this.sdk)
    this.resolver = this.sdk.resolver
    this.storage = this.sdk.storage
  }

  /**
   * The DID method that this Agent was constructed with, or otherwise the SDK's
   * default DID method
   */
  public get didMethod() {
    return this._didMethod || this.sdk.didMethods.getDefault()
  }

  /**
   * The Agent's IdentityWallet instance.
   *
   * @throws SDKError(ErrorCode.NoWallet) if there is none
   */
  public get identityWallet(): IdentityWallet {
    if (this._identityWallet) return this._identityWallet
    throw new SDKError(ErrorCode.NoWallet)
  }

  /**
   * Shortcut for {@link identityWallet}
   */
  public get idw(): IdentityWallet {
    return this.identityWallet
  }

  /**
   * The Agent's KeyProvider instance.
   *
   * @throws SDKError(ErrorCode.NoKeyProvider) if there is none
   */
  public get keyProvider(): SoftwareKeyProvider {
    if (this._keyProvider) return this._keyProvider
    throw new SDKError(ErrorCode.NoKeyProvider)
  }

  /**
   * Create and store new Identity using the Agent's {@link didMethod}
   *
   * @returns the newly created {@link IdentityWallet}
   *
   * @category Identity Management
   */
  public async createNewIdentity(): Promise<IdentityWallet> {
    const pass = await this.passwordStore.getPassword()
    this._keyProvider = await SoftwareKeyProvider.newEmptyWallet(
      walletUtils,
      '',
      pass,
    )
    this._identityWallet = await createIdentityFromKeyProvider(
      this._keyProvider,
      pass,
      this.didMethod.registrar,
    )

    await this.sdk.storeIdentityData(
      this._identityWallet.identity,
      this._keyProvider,
    )

    // This sets the didMethod so that it doesn't return a different value if
    // the SDK default is changed in runtime
    this._didMethod = this.didMethod

    return this._identityWallet
  }

  /**
   * Load an Identity from storage, given its DID.
   *
   * If no DID is specified, the first Identity found in storage will be loaded.
   *
   * @param did - DID of Identity to be loaded from DB
   * @returns An IdentityWallet corrosponding to the given DID
   *
   * @category Identity Management
   */
  public async loadIdentity(did?: string): Promise<IdentityWallet> {
    const encryptedWalletInfo = await this.storage.get.encryptedWallet(did)
    if (!encryptedWalletInfo) {
      throw new SDKError(ErrorCode.NoWallet)
    }

    let encryptionPass: string
    try {
      encryptionPass = await this.passwordStore.getPassword()
    } catch (e) {
      // This may fail if the application was uninstalled and reinstalled, as
      // the android keystore is cleared on uninstall, but the database may
      // still remain, due to having been auto backed up!
      throw new SDKError(ErrorCode.NoPassword, e)
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

    await this.storage.store.identity(identityWallet.identity)

    // This sets the didMethod so that it doesn't return a different value if
    // the SDK default is changed in runtime
    this._didMethod = this.didMethod

    return (this._identityWallet = identityWallet)
  }

  /**
   * Loads an Identity based on a BIP39 mnemonic phrase
   *
   * @param mnemonic - a BIP39 mnemonic phrase to use
   * @returns An IdentityWallet holding an Identity created by the configured
   *          DID Method given the entropy encoded in the mnemonic phrase
   *
   * @category Identity Management
   */
  public async loadFromMnemonic(mnemonic: string): Promise<IdentityWallet> {
    const pass = await this.passwordStore.getPassword()

    if (!this.didMethod.recoverFromSeed) {
      throw new Error(
        `Recovery not implemented for method ${this.didMethod.prefix}`,
      )
    }

    const {
      identityWallet,
      succesfullyResolved,
    } = await this.didMethod.recoverFromSeed(
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

    await this.sdk.storeIdentityData(
      this._identityWallet.identity,
      this._keyProvider,
    )

    // This sets the didMethod so that it doesn't return a different value if
    // the SDK default is changed in runtime
    this._didMethod = this.didMethod

    return identityWallet
  }

  /**
   * Creates and registers an Identity based on a BIP39 mnemonic phrase
   *
   * @param mnemonic - a BIP39 mnemonic phrase to use
   * @param shouldOverwrite - if true, overwrite any pre-existing identity in
   *                          storage (default false)
   * @returns An IdentityWallet holding an Identity created by the configured
   *          DID Method given the entropy encoded in the mnemonic phrase
   *
   * @category Identity Management
   */
  public async createFromMnemonic(
    mnemonic: string,
    shouldOverwrite?: boolean,
  ): Promise<IdentityWallet> {
    const pass = await this.passwordStore.getPassword()
    if (!this.didMethod.recoverFromSeed) {
      throw new Error(
        `Recovery not implemented for method ${this.didMethod.prefix}`,
      )
    }

    const {
      identityWallet,
      succesfullyResolved,
    } = await this.didMethod.recoverFromSeed(
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

    await this.didMethod.registrar.create(this.keyProvider, pass)

    await this.sdk.storeIdentityData(
      this._identityWallet.identity,
      this._keyProvider,
    )

    // This sets the didMethod so that it doesn't return a different value if
    // the SDK default is changed in runtime
    this._didMethod = this.didMethod

    return identityWallet
  }

  /**
   * Parses a recieved interaction token in JWT format and process it through
   * the interaction system, returning the corresponding Interaction
   *
   * @param jwt recieved jwt string
   * @returns Promise<Interaction> the associated Interaction object
   * @throws AppError<InvalidToken> with `origError` set to the original token
   *                                validation error from the jolocom library
   *
   * @category Interaction Management
   */
  public async processJWT(jwt: string, transportAPI?: TransportAPI): Promise<Interaction> {
    const token = JolocomLib.parse.interactionToken.fromJWT(jwt)

    const interaction = this.interactionManager.getInteraction(token.nonce)

    if (interaction) {
      await interaction.processInteractionToken(token)
      return interaction
    } else {
      return this.interactionManager.start(token, transportAPI)
    }
  }

  /**
   * Find an interaction, by id or by jwt, or by JSONWebToken object
   *
   * @param inp id, JWT string, or JSONWebToken object
   * @returns Promise<Interaction> the associated Interaction object
   * @category Interaction Management
   */
  public findInteraction<F extends Flow<any>>(inp: string | JSONWebToken<any>): Interaction<F> | null {
    let id
    if (typeof inp === 'string') {
      try {
        const token = JolocomLib.parse.interactionToken.fromJWT(inp)
        id = token.nonce
      } catch {
        // not a JWT, but maybe it's the nonce itself?
        id = inp
      }
    } else if (inp && inp.nonce) {
      id = inp.nonce
    } else {
      return null
    }

    return this.interactionManager.getInteraction<F>(id)
  }

  /**
   * Creates a signed, base64 encoded Authentication Request, given a
   * callbackURL
   *
   * @param callbackURL - the callbackURL to which the Authentication Response
   *                      should be sent
   * @returns Base64 encoded signed Authentication Request
   * @category Interaction Requests
   */
  public async authRequestToken(auth: {
    callbackURL: string
    description?: string
  }): Promise<string> {
    const token = await this.idw.create.interactionTokens.request.auth(
      auth,
      await this.passwordStore.getPassword(),
    )
    await this.interactionManager.start(token)
    return token.encode()
  }

  /**
   * Creates a signed, base64 encoded Resolution Request, given a URI
   *
   * @param uri - URI to request resolution for
   * @returns Base64 encoded signed Resolution Request
   * @category Interaction Requests
   */
  public async resolutionRequestToken(
    req: { description?: string; uri?: string; callbackURL?: string } = {},
  ): Promise<string> {
    const token = await this.idw.create.message(
      {
        message: req,
        typ: ResolutionType.ResolutionRequest,
      },
      await this.passwordStore.getPassword(),
    )

    await this.interactionManager.start(token)
    return token.encode()
  }

  /**
   * Creates a signed, base64 encoded Authorization Request, given the request
   * attributes
   *
   * @param request - Authrization Request Attributes
   * @returns Base64 encoded signed Authentication Request
   * @category Interaction Requests
   */
  public async authorizationRequestToken(
    request: AuthorizationRequest,
  ): Promise<string> {
    const token = await this.idw.create.message(
      {
        message: request,
        typ: AuthorizationType.AuthorizationRequest,
      },
      await this.passwordStore.getPassword(),
    )

    await this.interactionManager.start(token)
    return token.encode()
  }

  /**
   * Creates a signed, base64 encoded JWT for an EstablishChannelRequest interaction token
   *
   * @param request - EstablishChannelRequest Attributes
   * @returns Base64 encoded signed EstablishChannelRequest
   * @category Interaction Requests
   */
  public async establishChannelRequestToken(
    request: EstablishChannelRequest,
  ): Promise<string> {
    const token = await this.idw.create.message(
      {
        message: request,
        typ: EstablishChannelType.EstablishChannelRequest,
      },
      await this.passwordStore.getPassword(),
    )

    await this.interactionManager.start(token)
    return token.encode()
  }

  /**
   * Creates a signed, base64 encoded Credential Request, given a set of requirements
   *
   * @param request - Credential Request Attributes
   * @returns Base64 encoded signed credential request
   * @category Interaction Requests
   */
  public async credRequestToken(
    request: ICredentialRequestAttrs,
  ): Promise<string> {
    const token = await this.idw.create.interactionTokens.request.share(
      request,
      await this.passwordStore.getPassword(),
    )
    await this.interactionManager.start(token)
    return token.encode()
  }

  /**
   * Returns a base64 encoded signed credential offer token, given
   * request attributes
   *
   * @param offer - credential offer attributes
   * @returns A base64 encoded signed credential offer token offering
   * credentials according to `offer`
   * @category Interaction Requests
   */
  public async credOfferToken(
    offer: CredentialOfferRequestAttrs,
  ): Promise<string> {
    const token = await this.idw.create.interactionTokens.request.offer(
      offer,
      await this.passwordStore.getPassword(),
    )
    await this.interactionManager.start(token)
    return token.encode()
  }

  /**
   * Returns a base64 encoded signed credential issuance token, given
   * issuance attributes and a recieved token selecting desired issuance
   *
   * @param issuance - credential issuance attributes
   * @param selection - base64 encoded credential offer response token
   * @returns A base64 encoded signed issuance token containing verifiable
   * credentials
   * @category Credential Management
   */
  public async credIssuanceToken(
    issuance: ICredentialsReceiveAttrs,
    selection: string,
  ): Promise<string> {
    const token = await this.idw.create.interactionTokens.response.issue(
      issuance,
      await this.passwordStore.getPassword(),
      JolocomLib.parse.interactionToken.fromJWT(selection),
    )

    return token.encode()
  }

  /**
   * @category Interaction Requests
   */
  public async rpcDecRequest(req: {
    toDecrypt: Buffer
    callbackURL: string
  }): Promise<string> {
    const token = await this.idw.create.message(
      {
        message: {
          callbackURL: req.callbackURL,
          request: {
            data: req.toDecrypt.toString('base64'),
          },
        },
        typ: DecryptionType.DecryptionRequest,
      },
      await this.passwordStore.getPassword(),
    )

    await this.interactionManager.start(token)

    return token.encode()
  }

  /**
   * @category Interaction Requests
   */
  public async rpcEncRequest(req: {
    toEncrypt: Buffer
    target: string
    callbackURL: string
  }): Promise<string> {
    const token = await this.idw.create.message(
      {
        message: {
          callbackURL: req.callbackURL,
          request: {
            data: req.toEncrypt.toString('base64'),
            target: req.target,
          },
        },
        typ: EncryptionType.EncryptionRequest,
      },
      await this.passwordStore.getPassword(),
    )

    await this.interactionManager.start(token)

    return token.encode()
  }

  /**
   * @category Interaction Requests
   */
  public async signingRequest(req: {
    toSign: Buffer
    callbackURL: string
  }): Promise<string> {
    const token = await this.idw.create.message(
      {
        message: {
          callbackURL: req.callbackURL,
          request: {
            data: req.toSign.toString('base64'),
          },
        },
        typ: SigningType.SigningRequest,
      },
      await this.passwordStore.getPassword(),
    )

    await this.interactionManager.start(token)

    return token.encode()
  }

  /**
   * Returns a Signed Credential
   *
   * @param credParams - credential attributes
   * @returns SignedCredential instance
   * @category Credential Management
   */
  public async signedCredential<T extends BaseMetadata>(
    credParams: ISignedCredCreationArgs<T>,
  ) {
    return await this.idw.create.signedCredential(
      credParams,
      await this.passwordStore.getPassword(),
    )
  }
}
