import { Interaction } from './interaction'
import { FlowType } from './types'
import { InteractionType } from '@jolocom/protocol-ts/dist/lib/interactionTokens'

// FIXME why is this exported?
export interface FlowState { }

export abstract class Flow<T> {
  protected ctx: Interaction

  public static type: FlowType
  public abstract state: FlowState
  public static firstMessageType: InteractionType | string

  constructor(ctx: Interaction) {
    this.ctx = ctx
  }

  get type(): FlowType {
    // @ts-ignore
    return this.constructor.type
  }

  public getState() {
    return this.state
  }

  //@ts-ignore
  abstract async handleInteractionToken(
    message: T,
    messageType: string,
  ): Promise<boolean>
}
