import { Interaction } from './interaction'
import { Flow } from './flow'
import {
  FlowType,
  EstablishChannelRequest,
  EstablishChannelResponse,
  EstablishChannelType,
  EstablishChannelFlowState,
} from './types'
import { isEstablishChannelRequest, isEstablishChannelResponse } from './guards'

export class EstablishChannelFlow extends Flow<
  EstablishChannelRequest | EstablishChannelResponse
> {
  public state: EstablishChannelFlowState = {
    description: '',
    established: false,
  }
  public type = FlowType.EstablishChannel

  public constructor(ctx: Interaction) {
    super(ctx)
  }

  public async onValidMessage(
    token: EstablishChannelRequest | EstablishChannelResponse,
    interactionType: EstablishChannelType,
  ) {
    if (this.state.established) throw new Error('already established')

    if (isEstablishChannelRequest(token, interactionType)) {
      return this.consumeEstablishChannelRequest(token)
    }
    if (isEstablishChannelResponse(token, interactionType)) {
      return this.consumeEstablishChannelResponse(token)
    }
    throw new Error('Interaction type not found')
  }

  public async consumeEstablishChannelRequest(token: EstablishChannelRequest) {
    if (this.state.established) throw new Error('already established')
    this.state.description = token.description
    this.state.transports = token.transports

    return true
  }

  public async consumeEstablishChannelResponse(
    token: EstablishChannelResponse,
  ) {
    if (!this.state.transports) throw new Error('no transports yet!')

    this.state.transport = this.state.transports[token.transportIdx]
    if (!this.state.transport) {
      throw new Error('no transport at index ' + token.transportIdx + '.')
    }

    // TODO ensure that transport is actually successfully established
    this.state.established = true

    return true
  }
}
