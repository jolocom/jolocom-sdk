import { JolocomLib } from 'jolocom-lib'
import { BaseMetadata } from 'cred-types-jolocom-core'
import { IdentityWallet } from 'jolocom-lib/js/identityWallet/identityWallet'
import {
  ICredentialRequest,
  ICredentialRequestAttrs,
  CredentialOffer,
  CredentialOfferRequestAttrs,
  ICredentialsReceiveAttrs,
} from 'jolocom-lib/js/interactionTokens/interactionTokens.types'
import { ISignedCredCreationArgs } from 'jolocom-lib/js/credentials/signedCredential/types'
import {
  InteractionChannel,
  AuthorizationRequest,
} from './src/lib/interactionManager/types'
import { generateSecureRandomBytes } from './src/lib/util'
import { BackendError } from './src/lib/errors/types'

export {
  ICredentialRequest as CredentialRequirements,
  ICredentialRequestAttrs as CredentialRequest,
  CredentialOffer,
  CredentialOfferRequestAttrs,
  ICredentialsReceiveAttrs as CredentialPayload,
  BaseMetadata as CredentialDefinition,
  ISignedCredCreationArgs as CredentialData,
}
import { BackendMiddleware } from './src/backendMiddleware'
import defaultConfig from './src/config'
import { IStorage, IPasswordStore } from './src/lib/storage'
import { AuthorizationType } from 'src/lib/interactionManager/types'
export { NaivePasswordStore } from './src/lib/storage'
export { JolocomLib } from 'jolocom-lib'
export { JSONWebToken } from 'jolocom-lib/js/interactionTokens/JSONWebToken'
import { JSONWebToken } from 'jolocom-lib/js/interactionTokens/JSONWebToken'
import { Interaction } from './src/lib/interactionManager/interaction'
import { InteractionManager } from 'src/lib/interactionManager/interactionManager'

export interface IJolocomSDKConfig {
  storage: IStorage
  passwordStore: IPasswordStore
}

export interface IJolocomSDKInitOptions {
  dontAutoRegister?: boolean
}

export class JolocomSDK extends BackendMiddleware {
  public interactionManager: InteractionManager

  /**
   * FIXME merge the backendMiddleware code in here instead of extending??
   *       or perhaps the BackendMiddleware becomes the more "pure" layer,
   *       and the "sdk" instance is platform specific
   *
   * TODO: use the Keeper pattern
   *       so we can do sdk.identities.create()
                        sdk.interactions.create()
                        sdk.interactions.find()
                        etc

  identities: IdentityKeeper
  interactions: InteractionKeeper

  /**/

  constructor(conf: IJolocomSDKConfig) {
    super({
      ...defaultConfig,
      storage: conf.storage,
      passwordStore: conf.passwordStore
    })
    this.interactionManager = new InteractionManager(this)
  }

  public get idw(): IdentityWallet {
    return this.identityWallet
  }

  async init(opts: IJolocomSDKInitOptions = {}) {
    try {
      return await this.prepareIdentityWallet()
    } catch (err) {
      if (!(err instanceof BackendError)) throw err

      if (
        !opts.dontAutoRegister &&
        err.message === BackendError.codes.NoEntropy
      ) {
        const seed = await generateSecureRandomBytes(16)
        return this.createNewIdentity(seed)
      }

      throw err
    }
  }

  /**
   * Handles a recieved interaction token
   *
   * @param jwt - recieved jwt, Base64 encoded
   * @returns Promise<bool>, true: valid, false: invalid, reject: incorrect
   */
  public async tokenRecieved(jwt: string) {
    const token = JolocomLib.parse.interactionToken.fromJWT(jwt)

    const interaction = this.interactionManager.getInteraction(token.nonce)

    if (interaction) {
      return interaction.processInteractionToken(token)
    } else {
      await this.interactionManager.start(InteractionChannel.HTTP, token)
      return true
    }
  }

  /**
   * Parses a recieved interaction token in JWT format and process it through
   * the interaction system, returning the corresponding Interaction
   *
   * @param jwt recieved jwt string
   * @returns Promise<Interaction> the associated Interaction object
   * @throws AppError<InvalidToken> with `origError` set to the original token
   *                                validation error from the jolocom library
   */
  public async processJWT(jwt: string): Promise<Interaction> {
    const token = JolocomLib.parse.interactionToken.fromJWT(jwt)

    const interaction = this.interactionManager.getInteraction(token.nonce)

    if (interaction) {
      await interaction.processInteractionToken(token)
      return interaction
    } else {
      return this.interactionManager.start(InteractionChannel.HTTP, token)
    }
  }

  /**
   * Find an interaction, by id or by jwt, or by JSONWebToken object
   *
   * @param inp id, JWT string, or JSONWebToken object
   * @returns Promise<Interaction> the associated Interaction object
   */
  public findInteraction(inp: string | JSONWebToken<any>): Interaction | null {
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

    return this.interactionManager.getInteraction(id)
  }

  /**
   * Creates a signed, base64 encoded Authentication Request, given a
   * callbackURL
   *
   * @param callbackURL - the callbackURL to which the Authentication Response
   *                      should be sent
   * @returns Base64 encoded signed Authentication Request
   */
  public async authRequestToken(auth: {
    callbackURL: string
    description?: string
  }): Promise<string> {
    const token = await this.idw.create.interactionTokens.request.auth(
      auth,
      await this.keyChainLib.getPassword(),
    )
    await this.interactionManager.start(InteractionChannel.HTTP, token)
    return token.encode()
  }

  /**
   * Creates a signed, base64 encoded Authorization Request, given the request
   * attributes
   *
   * @param request - Authrization Request Attributes
   * @returns Base64 encoded signed Authentication Request
   */
  public async authorizationRequestToken(
    request: AuthorizationRequest,
  ): Promise<string> {
    const token = await this.idw.create.message(
      {
        message: request,
        typ: AuthorizationType.AuthorizationRequest,
      },
      await this.keyChainLib.getPassword(),
    )

    await this.interactionManager.start(InteractionChannel.HTTP, token)
    return token.encode()
  }

  /**
   * Creates a signed, base64 encoded Credential Request, given a set of requirements
   *
   * @param request - Credential Request Attributes
   * @returns Base64 encoded signed credential request
   */
  public async credRequestToken(
    request: ICredentialRequestAttrs,
  ): Promise<string> {
    const token = await this.idw.create.interactionTokens.request.share(
      request,
      await this.keyChainLib.getPassword(),
    )
    await this.interactionManager.start(InteractionChannel.HTTP, token)
    return token.encode()
  }

  /**
   * Returns a base64 encoded signed credential offer token, given
   * request attributes
   *
   * @param offer - credential offer attributes
   * @returns A base64 encoded signed credential offer token offering
   * credentials according to `offer`
   */
  public async credOfferToken(
    offer: CredentialOfferRequestAttrs,
  ): Promise<string> {
    const token = await this.idw.create.interactionTokens.request.offer(
      offer,
      await this.keyChainLib.getPassword(),
    )
    await this.interactionManager.start(InteractionChannel.HTTP, token)
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
   */
  public async credIssuanceToken(
    issuance: ICredentialsReceiveAttrs,
    selection: string,
  ): Promise<string> {
    const token = await this.idw.create.interactionTokens.response.issue(
      issuance,
      await this.keyChainLib.getPassword(),
      JolocomLib.parse.interactionToken.fromJWT(selection),
    )

    return token.encode()
  }

  /**
   * Returns a Signed Credential
   *
   * @param credParams - credential attributes
   * @returns SignedCredential instance
   */
  public async signedCredential<T extends BaseMetadata>(
    credParams: ISignedCredCreationArgs<T>,
  ) {
    return await this.idw.create.signedCredential(
      credParams,
      await this.keyChainLib.getPassword(),
    )
  }
}
