import { Interaction } from './interaction'
import { Flow } from './flow'
import { EncryptionFlowState, FlowType, EncryptionType } from './types'
import { isEncryptionRequest, isEncryptionResponse } from './guards'
import { EncryptionRequest, EncryptionResponse } from './rpc'

export class EncryptionFlow extends Flow<
  EncryptionRequest | EncryptionResponse
> {
  public type = FlowType.Encrypt
  public state: EncryptionFlowState = {
    req: {
      callbackURL: '',
      request: { target: '', data: '' },
    },
  }

  public constructor(ctx: Interaction) {
    super(ctx)
  }

  public onValidMessage(
    token: EncryptionRequest | EncryptionResponse,
    interactionType: string,
  ) {
    switch (interactionType) {
      case EncryptionType.EncryptionRequest:
        if (isEncryptionRequest(token, interactionType))
          return this.consumeEncryptionRequest(token)
      case EncryptionType.EncryptionResponse:
        if (isEncryptionResponse(token, interactionType))
          return this.consumeEncryptionResponse(token)
      default:
        throw new Error('Interaction type not found')
    }
  }

  public async consumeEncryptionRequest(token: EncryptionRequest) {
    if (!this.state.req.request) this.state.req.request = token.request

    return true
  }

  public async consumeEncryptionResponse(token: EncryptionResponse) {
    this.state.encryptedData = Buffer.from(token.result, "base64")
    return true
  }
}
