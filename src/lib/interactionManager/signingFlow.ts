import { Interaction } from './interaction'
import { Flow } from './flow'
import { SigningFlowState } from './types'
import { isSigningRequest, isSigningResponse } from './guards'
import { CallType, SigningRequest, SigningResponse } from './rpc'

export class SigningFlow extends Flow<SigningRequest | SigningResponse> {
  public state: SigningFlowState = {
    req: '',
  }

  public constructor(ctx: Interaction) {
    super(ctx)
  }

  public handleInteractionToken(
    token: SigningRequest | SigningResponse,
    interactionType: string,
  ) {
    if (interactionType === CallType.Sign) {
      if (isSigningRequest(token)) return this.consumeSigningRequest(token)
      else if (isSigningResponse(token))
        return this.consumeSigningResponse(token)
    }
    throw new Error('Interaction type not found')
  }

  public async consumeSigningRequest(token: SigningRequest) {
    if (!this.state.req) this.state.req = token.request

    return true
  }

  public async consumeSigningResponse(token: SigningResponse) {
    // should verify that the signature is correct
    return true
  }
}
