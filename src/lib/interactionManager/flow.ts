import { Interaction } from './interaction'
import { FlowType } from './types'
import { JSONWebToken } from 'jolocom-lib/js/interactionTokens/JSONWebToken'

export interface FlowState {}

export abstract class Flow<RequestToken, ResponseToken> {
  protected ctx: Interaction
  public abstract state: FlowState
  public abstract type: FlowType

  constructor(ctx: Interaction) {
    this.ctx = ctx
  }

  abstract async handleInteractionToken(
    token: RequestToken,
    messageType: string,
  ): Promise<boolean>

  abstract async createResponseMessage(n: number): Promise<JSONWebToken<ResponseToken>>

  public getState() {
    return this.state
  }
}
