import { initStore } from 'src/node.polyfill'
import * as entities from 'src/lib/storage/entities'
import * as actions from 'src/actions'
import { JolocomLib } from 'jolocom-lib'
import { interactionHandlers } from 'src/lib/storage/interactionTokens'
import { withErrorHandler } from './actions/modifiers'
import { AppError } from './lib/errors'
import { ThunkAction, ThunkDispatch } from './store'
import { IdentityWallet } from 'jolocom-lib/js/identityWallet/identityWallet'

export { initStore, entities, actions }

const initErrorHandler = (error: AppError | Error): ThunkAction => dispatch => {
  console.error(error.message)
  return Promise.reject(error)
}

export class JolocomSDK {
  private store: ReturnType<typeof initStore>
  private dispatch: ThunkDispatch
  public idw: IdentityWallet

  constructor(store: ReturnType<typeof initStore>) {
    this.store = store
    this.dispatch = this.store.dispatch
    this.idw = this.store.backendMiddleware.identityWallet
  }

  static async fromStore(store: ReturnType<typeof initStore>) {
    await (store.dispatch as ThunkDispatch)(
      withErrorHandler(initErrorHandler)(
        actions.accountActions.checkIdentityExists,
      ),
    )

    return new JolocomSDK(store)
  }

  static async fromMnomic(mnemonic: string) {
    const store = initStore()
    await (store.dispatch as ThunkDispatch)(
      actions.registrationActions.recoverIdentity(mnemonic),
    )

    return new JolocomSDK(store)
  }

  static async newDIDFromSeed(seed: Buffer) {
    const store = initStore()
    await (store.dispatch as ThunkDispatch)(
      actions.registrationActions.createIdentity(seed.toString('hex')),
    )

    return new JolocomSDK(store)
  }

  public async tokenRecieved(jwt: string) {
    const token = JolocomLib.parse.interactionToken.fromJWT(jwt)

    await this.store.backendMiddleware.storageLib.store.interactionToken(token)
    await this.dispatch(interactionHandlers[token.interactionType](token))
  }
}
