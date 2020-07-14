import { Interaction } from './interaction'
import { FlowType } from './types'

// FIXME why is this exported?
export interface FlowState {}

export abstract class Flow<T> {
  protected ctx: Interaction
  public abstract state: FlowState
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
