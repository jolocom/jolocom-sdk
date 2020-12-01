import { JSONWebToken } from 'jolocom-lib/js/interactionTokens/JSONWebToken'
import { Interaction } from './interaction'
import { Agent } from '../agent'
import { Flow } from './flow'
import { TransportAPI } from '../types'
import { SDKError, ErrorCode } from '../errors'

/**
 * The {@link InteractionManager} is an entry point to dealing with {@link
 * Interaction}s. It also manages {@link InteractionTransport}s by extending
 * {@link Transportable}.  It is meant to be instantiated in context of a {@link
 * JolocomSDK} instance.
 *
 * Interactions are not serialized or fetched from storage, only the
 * interaction tokens ({@link JSONWebToken}). Currently the `InteractionManager`
 * holds a map of all interactions in memory, keyed by ID (which is just the
 * nonce of the first {@link JSONWebToken}).
 *
 *
 * @category Interactions
 */
export class InteractionManager {
  public readonly ctx: Agent

  public interactions: {
    [NONCE: string]: Interaction<Flow<any>>
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

  /**
   * Returns an {@link Interaction} instance by ID, if there is one in memory.
   * Otherwise tries to reconstruct the Interaction from tokens that were
   * previously processed through the SDK (and thus committed to storage).
   *
   * @param id - the interaction ID
   * @param transportAPI - transportAPI to use in case trying to load the
   *                       interaction from storage
   * @throws SDKError(ErrorCode.NoSuchInteraction) if not found
   */
  public async getInteraction<F extends Flow<any>>(id: string, transportAPI?: TransportAPI) {
    // NOTE FIXME TODO
    // should getInteraction be taking a transportAPI argument?
    // what if the transportAPI is specified but interaction is loaded from
    // memory?
    // should getInteraction be instantiating new interactions like this?
    // should there be a separate loadInteraction method?

    // if there's an interaction instance, we return it
    if (this.interactions[id]) return this.interactions[id]

    // otherwise we try to reconstruct the interaction object from the stored
    // interaction messages
    const messages = await this.ctx.storage.get.interactionTokens({ nonce: id })
    if (messages.length === 0) throw new SDKError(ErrorCode.NoSuchInteraction)
    const interxn = await Interaction.fromMessages(messages, this, id, transportAPI)

    this.interactions[id] = interxn
    return interxn
  }
}
