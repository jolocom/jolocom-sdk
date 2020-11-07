import { Interaction } from './interaction'
import { FlowType } from './types'

// FIXME why is this exported?
export interface FlowState { }

export abstract class Flow<T> {
  protected ctx: Interaction

  public abstract type: FlowType
  public abstract state: FlowState

  constructor(ctx: Interaction) {
    this.ctx = ctx
  }

  public getState() {
    return this.state
  }

  abstract async handleInteractionToken(
    message: T,
    messageType: string,
  ): Promise<boolean>
}
