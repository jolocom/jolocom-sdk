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
import { InteractionChannel } from './src/lib/interactionManager/types'

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
import config from './src/config'
import { IStorage } from './src/lib/storage'

// @ts-ignore
// const injectPassFn = (passFn: () => Promise<string>) => <A, T>(
//   delayedFn: (arg1: A, pass: string, ...rest) => Promise<T>,
// ) => async (a1: A, ...rest) => await delayedFn(a1, await passFn())

export class JolocomSDK {
  public idw: IdentityWallet
  public bemw: BackendMiddleware

  constructor(storage: IStorage) {
    this.bemw = new BackendMiddleware({ ...config, storage })
    this.idw = this.bemw.identityWallet
  }

  /**
   * Handles a recieved interaction token
   *
   * @param jwt - recieved jwt, Base64 encoded
   * @returns Promise<bool>, true: valid, false: invalid, reject: incorrect
   */
  public async tokenRecieved(jwt: string) {
    const token = JolocomLib.parse.interactionToken.fromJWT(jwt)

    const interaction = this.bemw.interactionManager.getInteraction(
      token.nonce,
    )

    if (interaction) {
      return interaction.processInteractionToken(token)
    } else {
      this.bemw.interactionManager.start(
        InteractionChannel.HTTP,
        token,
      )
      return true
    }
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
      await this.bemw.keyChainLib.getPassword(),
    )
    await this.bemw.interactionManager.start(
      InteractionChannel.HTTP,
      token,
    )
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
      await this.bemw.keyChainLib.getPassword(),
    )
    await this.bemw.interactionManager.start(
      InteractionChannel.HTTP,
      token,
    )
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
      await this.bemw.keyChainLib.getPassword(),
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
      await this.bemw.keyChainLib.getPassword(),
    )
  }
}
