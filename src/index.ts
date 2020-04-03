import { initStore } from 'src/node.polyfill'
import * as entities from 'src/lib/storage/entities'
import * as actions from 'src/actions'
import { JolocomLib } from 'jolocom-lib'
import { interactionHandlers } from 'src/lib/storage/interactionTokens'
import { withErrorHandler } from './actions/modifiers'
import { AppError } from './lib/errors'
import { ThunkAction, ThunkDispatch } from './store'
import { IdentityWallet } from 'jolocom-lib/js/identityWallet/identityWallet'
import {
  ICredentialRequestAttrs,
  CredentialOfferRequestAttrs,
  ICredentialsReceiveAttrs,
} from 'jolocom-lib/js/interactionTokens/interactionTokens.types'

export { initStore, entities, actions }

const initErrorHandler = (error: AppError | Error): ThunkAction => dispatch => {
  console.error(error.message)
  return Promise.reject(error)
}

// @ts-ignore
// const injectPassFn = (passFn: () => Promise<string>) => <A, T>(
//   delayedFn: (arg1: A, pass: string, ...rest) => Promise<T>,
// ) => async (a1: A, ...rest) => await delayedFn(a1, await passFn())

export class JolocomSDK {
  private store: ReturnType<typeof initStore>
  private dispatch: ThunkDispatch
  public idw: IdentityWallet

  constructor(store: ReturnType<typeof initStore>) {
    this.store = store
    this.dispatch = this.store.dispatch
    this.idw = this.store.backendMiddleware.identityWallet
  }

  /**
   * Returns an agent with an Identity provided by a store
   *
   * @remarks
   * This depends on an existing database connection
   *
   * @param store - The agent state with storage connection
   * @returns An Agent with the identity existing in the storage in store
   */
  static async fromStore(store: ReturnType<typeof initStore>) {
    await (store.dispatch as ThunkDispatch)(
      withErrorHandler(initErrorHandler)(
        actions.accountActions.checkIdentityExists,
      ),
    )

    return new JolocomSDK(store)
  }

  /**
   * Returns an agent with an Identity provided by a BIP 39 12 word seed phrase
   *
   * @param mnemonic - 12 word BIP 39 seed phrase, space-delimited
   * @returns An Agent with the identity corrosponding to the sead phrase
   */
  static async fromMnemonic(mnemonic: string) {
    const store = initStore()
    await (store.dispatch as ThunkDispatch)(
      actions.registrationActions.recoverIdentity(mnemonic),
    )

    return new JolocomSDK(store)
  }

  /**
   * Returns an agent with an Identity provided by a buffer of entropy.
   * WARNING: this registers an identity on the Jolocom DID Method
   *
   * @param seed - Buffer of private entropy to generate keys with
   * @returns An Agent with the identity corrosponding to the seed
   */
  static async newDIDFromSeed(seed: Buffer) {
    const store = initStore()
    await (store.dispatch as ThunkDispatch)(
      actions.registrationActions.createIdentity(seed.toString('hex')),
    )

    return new JolocomSDK(store)
  }

  /**
   * Handles a recieved interaction token
   *
   * @param jwt - recieved jwt, Base64 encoded
   * @returns TODO
   */
  public async tokenRecieved(jwt: string) {
    const token = JolocomLib.parse.interactionToken.fromJWT(jwt)

    await this.store.backendMiddleware.storageLib.store.interactionToken(token)

    await this.dispatch(interactionHandlers[token.interactionType](token))
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
      await this.store.backendMiddleware.keyChainLib.getPassword(),
    )
    this.store.backendMiddleware.storageLib.store.interactionToken(token)
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
      await this.store.backendMiddleware.keyChainLib.getPassword(),
    )
    this.store.backendMiddleware.storageLib.store.interactionToken(token)
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
      await this.store.backendMiddleware.keyChainLib.getPassword(),
      await JolocomLib.parse.interactionToken.fromJWT(selection),
    )

    this.store.backendMiddleware.storageLib.store.interactionToken(token)
    return token.encode()
  }
}
