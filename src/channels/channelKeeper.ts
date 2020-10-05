import { FlowType } from '../interactionManager/types'
import { Interaction } from '../interactionManager/interaction'
import { Channel } from './channel'
import { Agent } from '../agent'
import { TransportAPI } from '../types'

export class ChannelKeeper {
  ctx: Agent

  private _channels: {
    [NONCE: string]: Channel
  } = {}

  constructor(ctx: Agent) {
    this.ctx = ctx
  }

  public async get(id: string) {
    const ch = this._channels[id]
    if (!ch) throw new Error('no such channel: ' + JSON.stringify(id))
    return ch
  }

  public async create(initInterxn: Interaction, transportAPI?: TransportAPI) {
    if (initInterxn.flow.type !== FlowType.EstablishChannel) {
      throw new Error(
        'not an EstablishChannel interaction: ' + initInterxn.flow.type,
      )
    }
    const ch = new Channel(this, initInterxn, transportAPI)
    this._channels[ch.id] = ch

    return ch
  }

  async findByJWT(jwt: string) {
    const interxn = this.ctx.findInteraction(jwt)
    const chId = interxn && interxn.flow.type === FlowType.EstablishChannel
      ? interxn.id
      : ''
    return this.get(chId)
  }
}
