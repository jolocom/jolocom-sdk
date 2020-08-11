import { Authentication } from 'jolocom-lib/js/interactionTokens/authentication'
import { InteractionType } from 'jolocom-lib/js/interactionTokens/types'
import { Interaction } from './interaction'
import { Flow } from './flow'
import { AuthenticationFlowState, FlowType } from './types'
import { isAuthenticationRequest } from './guards'

export class AuthenticationFlow extends Flow<
  Authentication,
  AuthenticationFlowState
> {
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
    // FIXME what's with this multilayer type checking
    switch (interactionType) {
      case InteractionType.Authentication:
        // FIXME there's already enough type information from the guard
        // These guards are necessary, the instanceof check can happen here
        // directly
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
}
