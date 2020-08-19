import { Interaction } from './interaction'
import { FlowType } from './types'
import { JSONWebToken } from '../../..'
import { last } from 'ramda'
import { AppError, ErrorCode } from '../errors'

// FIXME why is this exported?
export interface FlowState {}

export abstract class Flow<T> {
  protected history: Array<JSONWebToken<T>> = []
  protected ctx: Interaction

  public abstract type: FlowType
  public abstract state: FlowState

  constructor(ctx: Interaction) {
    this.ctx = ctx
  }

  public getState() {
    return this.state
  }

  public async handleInteractionToken(token: JSONWebToken<T>) {
    try {
      await this.ctx.ctx.ctx.identityWallet.validateJWT(
        token,
        last(this.history),
        this.ctx.ctx.ctx.didMethods.getDefault().resolver,
      )
      this.history.push(token)
      return this.onValidMessage(token.interactionToken, token.interactionType)
    } catch (err) {
      throw new AppError(ErrorCode.InvalidToken, err)
    }
  }

  abstract async onValidMessage(
    message: T,
    messageType: string,
  ): Promise<boolean>
}
