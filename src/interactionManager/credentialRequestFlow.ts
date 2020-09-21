import { InteractionType } from 'jolocom-lib/js/interactionTokens/types'
import { CredentialRequest } from 'jolocom-lib/js/interactionTokens/credentialRequest'
import { Interaction } from './interaction'
import { Flow } from './flow'
import { CredentialResponse } from 'jolocom-lib/js/interactionTokens/credentialResponse'
import { CredentialRequestFlowState, FlowType } from './types'
import { isCredentialRequest, isCredentialResponse } from './guards'

export class CredentialRequestFlow extends Flow<
  CredentialRequest | CredentialResponse
> {
  public state: CredentialRequestFlowState = {
    constraints: [],
    providedCredentials: [],
  }
  public type = FlowType.CredentialShare

  constructor(ctx: Interaction) {
    super(ctx)
  }

  /*
   * Implementation of the abstract handler defined in {@link Flow}
   * Given an interaction token, will fire the appropriate step in the protocol or throw
   */

  public async onValidMessage(
    token: CredentialRequest | CredentialResponse,
    interactionType: string,
  ) {
    switch (interactionType) {
      case InteractionType.CredentialRequest:
        if (isCredentialRequest(token)) {
          return this.handleCredentialRequest(token)
        }
      case InteractionType.CredentialResponse:
        if (isCredentialResponse(token)) {
          return this.handleCredentialResponse(token)
        }
      default:
        throw new Error('Interaction type not found')
    }
  }

  private async handleCredentialRequest(request: CredentialRequest) {
    this.state.constraints.push(request)
    return true
  }

  private async handleCredentialResponse(token: CredentialResponse) {
    this.state.providedCredentials.push(token)
    const lastIndex = this.state.constraints.length - 1
    if (lastIndex >= 0) {
      return token.satisfiesRequest(this.state.constraints[lastIndex])
    } else return true
  }
}
