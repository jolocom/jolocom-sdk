import { Authentication } from 'jolocom-lib/js/interactionTokens/authentication'
//import { IAuthenticationAttrs } from 'jolocom-lib/js/interactionTokens/interactionTokens.types'
import { InteractionType } from 'jolocom-lib/js/interactionTokens/types'
import { Interaction } from './interaction'
import { Flow } from './flow'
import { AuthenticationFlowState, FlowType } from './types'
import { isAuthenticationRequest } from './guards'

export class AuthenticationFlow extends Flow<Authentication, Authentication> {
  public state: AuthenticationFlowState = { description: '' }
  public type = FlowType.Authentication

  public constructor(ctx: Interaction) {
    super(ctx)
  }

  // TODO InteractionType.AuthenticaitonResponse should exist
  public handleInteractionToken(
    token: Authentication,
    interactionType: string,
  ) {
    switch (interactionType) {
      case InteractionType.Authentication:
        if (isAuthenticationRequest(token))
          return this.consumeAuthenticationRequest(token)
      default:
        throw new Error('Interaction type not found')
    }
  }

  public async consumeAuthenticationRequest(token: Authentication) {
    if (!this.state.description) this.state.description = token.description

    return this.state.description === token.description
  }

  public async createResponseMessage(n = 0) {
    const req = this.ctx.getRequest(n)
    const { description } = this.state
    // TODO error codes
    if (!description) throw new Error('no description in Authentication interaction!')

    return this.ctx.createResponseMessage<Authentication, Authentication>({
      // @ts-ignore TODO
      message: { description, callbackURL: '' },
      typ: InteractionType.Authentication,
    }, req)
  }
}
