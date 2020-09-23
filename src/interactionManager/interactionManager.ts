import { JSONWebToken } from 'jolocom-lib/js/interactionTokens/JSONWebToken'
import { Interaction } from './interaction'
import { Agent } from '../agent'
import { Flow } from './flow'
import { TransportAPI } from '../types'

/***
 * - initiated inside BackendMiddleware
 * - has access to identityWallet / registry ?? (or should be inside Interaction)
 * - holds a map of all interactions:
 *    - {nonce: token or interaction instance} ??
 * - can start / end an interaction
 *
 */

export class InteractionManager{
  public readonly ctx: Agent

  public interactions: {
    [NONCE: string]: Interaction
  } = {}

  public constructor(ctx: Agent) {
    this.ctx = ctx
  }

  public async start<F extends Flow<any>>(
    token: JSONWebToken<any>,
    transportAPI?: TransportAPI
  ): Promise<Interaction<F>> {
    const interaction = new Interaction<F>(
      this,
      token.nonce,
      token.interactionType,
      transportAPI
    )
    this.interactions[token.nonce] = interaction
    await interaction.processInteractionToken(token)

    return interaction
  }

  // FIXME this can return UNDEFINED, should throw an error
  // FIXME need to be async to support storage backends
  public getInteraction<F extends Flow<any> = Flow<any>>(id: string) {
    return this.interactions[id] as Interaction<F>
  }
}
