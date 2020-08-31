import { Interaction } from './interaction'
import { Flow, FlowState } from './flow'
import { DecryptionRequest, DecryptionResponse, FlowType, DecryptionType } from './types'
import { isDecryptionRequest, isDecryptionResponse } from './guards'

export interface DecryptionFlowState extends FlowState {
  request?: DecryptionRequest
  decryptedData?: Buffer
}

export class DecryptionFlow extends Flow<
  DecryptionRequest | DecryptionResponse
> {
  public type = FlowType.Decrypt
  public state: DecryptionFlowState = {}

  public constructor(ctx: Interaction) {
    super(ctx)
  }

  public onValidMessage(
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
    if (this.state.request) return false // FIXME throw
    this.state.request = token
    return true
  }

  public async consumeDecryptionResponse(token: DecryptionResponse) {
    this.state.decryptedData = Buffer.from(token.result, 'base64')
    return true
  }
}
