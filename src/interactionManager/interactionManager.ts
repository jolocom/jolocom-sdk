import { JSONWebToken } from 'jolocom-lib/js/interactionTokens/JSONWebToken'
import { Interaction, flows } from './interaction'
import { Agent } from '../agent'
import { Flow } from './flow'
import { TransportAPI } from '../types'
import { SDKError, ErrorCode } from '../errors'
import { FlowType } from './types'

import { Emitter } from '../events'

const firstMessageForFlowType = {}
flows.forEach((f) => {
  firstMessageForFlowType[f.type] = f.firstMessageType
})

export interface InteractionEvents {
  interactionCreated: (interxn: Interaction) => void
  interactionUpdated: (interxn: Interaction) => void
  interactionResumed: (interxn: Interaction) => void
}

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
export class InteractionManager extends Emitter<InteractionEvents> {
  public interactions: {
    [NONCE: string]: Interaction<Flow<any>>
  } = {}

  public constructor(public readonly ctx: Agent) {
    super()
  }

  public async start<F extends Flow<any>>(
    token: JSONWebToken<any>,
    transportAPI?: TransportAPI,
  ): Promise<Interaction<F>> {
    const interaction = new Interaction<F>(
      this,
      token.nonce,
      token.interactionType,
      transportAPI,
    )
    this.interactions[token.nonce] = interaction
    await interaction.processInteractionToken(token)
    await this.ctx.storage.store.interactionToken(token)

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
  public async getInteraction<F extends Flow<any>>(
    id: string,
    transportAPI?: TransportAPI,
  ) {
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

    const interxn = await Interaction.fromMessages(
      messages,
      this,
      id,
      transportAPI,
    )

    this.interactions[id] = interxn

    return interxn
  }

  /**
   * Returns a list of {@link Interaction} instances given filtering and
   * pagination criteria
   *
   * @param flows - a list of {@link FlowType}s or Flow classes
   * @param take - number of results to return (pagination limit)
   * @param skip - number of results to skip (pagination offset)
   * @param reverse - if true, return the list in reverse storage order
   */
  public async listInteractions<T>(opts?: {
    flows?: Array<FlowType | { firstMessageType: string; type: string }>
    take?: number
    skip?: number
    reverse?: boolean
  }): Promise<Interaction[]> {
    let queryOpts = opts && {
      take: opts.take,
      skip: opts.skip,
      ...(opts.reverse && { order: { id: 'DESC' as 'DESC' } }),
    }
    const attrs =
      opts &&
      opts.flows &&
      opts.flows.map((f) => ({
        type: typeof f === 'string' ? f : f.type,
      }))
    const ids = await this.ctx.storage.get.interactionIds(attrs, queryOpts)
    return Promise.all(ids.map((id: string) => this.getInteraction(id)))
  }
}
