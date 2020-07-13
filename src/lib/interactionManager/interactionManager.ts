import { JolocomSDK } from 'index'
import { JSONWebToken } from 'jolocom-lib/js/interactionTokens/JSONWebToken'
import { Interaction } from './interaction'
import { InteractionTransportType } from './types'

/***
 * - initiated inside BackendMiddleware
 * - has access to identityWallet / registry ?? (or should be inside Interaction)
 * - holds a map of all interactions:
 *    - {nonce: token or interaction instance} ??
 * - can start / end an interaction
 *
 */

export class InteractionManager {
  public readonly ctx: JolocomSDK

  public interactions: {
    [NONCE: string]: Interaction
  } = {}

  public constructor(ctx: JolocomSDK) {
    this.ctx = ctx
  }

  public async start<T>(channel: InteractionTransportType, token: JSONWebToken<T>) {
    const interaction = await Interaction.start(
      this,
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
