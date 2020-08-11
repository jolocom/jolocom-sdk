import { Interaction } from './interaction'
import { FlowType } from './types'

export interface FlowState {}

export abstract class Flow<T, K extends FlowState> {
  protected ctx: Interaction
  public abstract state: K
  public abstract type: FlowType

  constructor(ctx: Interaction) {
    this.ctx = ctx
  }

  abstract async handleInteractionToken(
    token: T,
    messageType: string,
  ): Promise<boolean>

  public getState() {
    return this.state
  }
}
