import { Interaction } from './interaction'
import { Flow } from './flow'
import { DecryptionFlowState } from './types'
import { isDecryptionRequest, isDecryptionResponse } from './guards'
import { CallType, DecryptionRequest, DecryptionResponse } from './rpc'

export class DecryptionFlow extends Flow<
  DecryptionRequest | DecryptionResponse
> {
  public state: DecryptionFlowState = {
    req: { callbackURL: '', rpc: CallType.AsymDecrypt, request: '' },
  }

  public constructor(ctx: Interaction) {
    super(ctx)
  }

  public handleInteractionToken(
    token: DecryptionRequest | DecryptionResponse,
    interactionType: string,
  ) {
    if (interactionType === CallType.AsymDecrypt) {
      if (isDecryptionRequest(token))
        return this.consumeDecryptionRequest(token)
      else if (isDecryptionResponse(token))
        return this.consumeDecryptionResponse(token)
    }
    throw new Error('Interaction type not found')
  }

  public async consumeDecryptionRequest(token: DecryptionRequest) {
    if (!this.state.req.request) this.state.req.request = token.request

    return true
  }

  public async consumeDecryptionResponse(token: DecryptionResponse) {
    return true
  }
}
