import { JSONWebToken } from 'jolocom-lib/js/interactionTokens/JSONWebToken'
import { Interaction } from './interaction'
import { BackendMiddleware } from '../../backendMiddleware'
import { InteractionChannel } from './types'
//import { WebSocketsKeeper } from './websockets'

/***
 * - initiated inside BackendMiddleware
 * - has access to identityWallet / registry ?? (or should be inside Interaction)
 * - holds a map of all interactions:
 *    - {nonce: token or interaction instance} ??
 * - can start / end an interaction
 *
 */

export class InteractionManager {
  public interactions: {
    [NONCE: string]: Interaction
  } = {}

  public readonly backendMiddleware: BackendMiddleware

  public constructor(backendMiddleware: BackendMiddleware) {
    this.backendMiddleware = backendMiddleware
  }

  public async start<T>(channel: InteractionChannel, token: JSONWebToken<T>) {
    console.log(JSON.stringify(token))

    const interaction = await Interaction.start(
      this.backendMiddleware,
      channel,
      token,
    )

    this.interactions[token.nonce] = interaction
    return interaction
  }

  // FIXME this can return UNDEFINED, should throw an error
  public getInteraction(id: string) {
    return this.interactions[id]
  }
}
