import { EstablishChannelFlowState, FlowType } from '../interactionManager/types'
import { Interaction } from '../interactionManager/interaction'
import { JolocomSDK } from 'index'
import { Channel } from './channel'
import { Transportable } from '../transports'

export enum ChannelTransportType {
  WebSockets = 'WebSockets'
}
export interface ChannelTransport {
  type: ChannelTransportType
  config: any
}

export interface ChannelTransportAPI {
  send: (m: string) => void
  receive: () => Promise<string>
  stop: () => void
  ready: Promise<void>
  desc?: ChannelTransport
}

export class ChannelKeeper extends Transportable<ChannelTransport, ChannelTransportAPI> {
  ctx: JolocomSDK

  private _channels: {
    [NONCE: string]: Channel
  } = {}

  constructor(ctx: JolocomSDK) {
    super()
    this.ctx = ctx
  }

  public async get(id: string) {
    const ch = this._channels[id]
    if (!ch) throw new Error('no such channel ' + id)
    return ch
  }

  public async create(initInterxn: Interaction) {
    if (initInterxn.flow.type !== FlowType.EstablishChannel) {
      throw new Error('not an EstablishChannel interaction: ' + initInterxn.flow.type)
    }
    const flowState = initInterxn.flow.getState() as EstablishChannelFlowState
    const transportConfig = flowState.transport
    const transportAPI = transportConfig && await this.createTransport(transportConfig)
    if (transportAPI) await transportAPI.ready

    const ch = new Channel(
      this,
      initInterxn,
      transportAPI
    )

    this._channels[ch.id] = ch

    return ch
  }

  async findByJWT(jwt: string) {
    const interxn = this.ctx.findInteraction(jwt)
    if (!interxn || interxn.flow.type !== FlowType.EstablishChannel) return
    return this.get(interxn.id)
  }
}
