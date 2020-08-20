import { Interaction } from './interaction'
import { Flow } from './flow'
import { DecryptionFlowState, FlowType, DecryptionType } from './types'
import { isDecryptionRequest, isDecryptionResponse } from './guards'
import { DecryptionRequest, DecryptionResponse } from './rpc'

export class DecryptionFlow extends Flow<
  DecryptionRequest | DecryptionResponse
> {
  public type = FlowType.Decrypt
  public state: DecryptionFlowState = {
    req: { callbackURL: '', request: '' },
  }

  public constructor(ctx: Interaction) {
    super(ctx)
  }

  public handleInteractionToken(
    token: DecryptionRequest | DecryptionResponse,
    interactionType: string,
  ) {
    switch (interactionType) {
      case DecryptionType.DecryptionRequest:
        if (isDecryptionRequest(token, interactionType))
          return this.consumeDecryptionRequest(token)
      case DecryptionType.DecryptionResponse:
        if (isDecryptionResponse(token, interactionType))
          return this.consumeDecryptionResponse(token)
      default:
        throw new Error('Interaction type not found')
    }
  }

  public async consumeDecryptionRequest(token: DecryptionRequest) {
    if (!this.state.req.request) this.state.req.request = token.request

    return true
  }

  public async consumeDecryptionResponse(token: DecryptionResponse) {
    return true
  }
}
