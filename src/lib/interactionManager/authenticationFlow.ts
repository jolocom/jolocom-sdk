import { Authentication } from 'jolocom-lib/js/interactionTokens/authentication'
import { InteractionType } from 'jolocom-lib/js/interactionTokens/types'
import { Interaction } from './interaction'
import { Flow } from './flow'
import { AuthenticationFlowState } from './types'
import { isAuthenticationRequest } from './guards'

export class AuthenticationFlow extends Flow<Authentication> {
  public state: AuthenticationFlowState = { description: '' }

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
}
