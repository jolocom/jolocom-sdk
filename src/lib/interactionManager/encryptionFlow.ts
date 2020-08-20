import { Interaction } from './interaction'
import { Flow } from './flow'
import { EncryptionFlowState, FlowType } from './types'
import { isEncryptionRequest, isEncryptionResponse } from './guards'
import { CallType, EncryptionRequest, EncryptionResponse } from './rpc'

export class EncryptionFlow extends Flow<
  EncryptionRequest | EncryptionResponse
> {
  public type = FlowType.Encrypt
  public state: EncryptionFlowState = {
    req: {
      callbackURL: '',
      rpc: CallType.AsymEncrypt,
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
    if (interactionType === CallType.AsymEncrypt) {
      if (isEncryptionRequest(token))
        return this.consumeEncryptionRequest(token)
      else if (isEncryptionResponse(token))
        return this.consumeEncryptionResponse(token)
    }
    throw new Error('Interaction type not found')
  }

  public async consumeEncryptionRequest(token: EncryptionRequest) {
    if (!this.state.req.request) this.state.req.request = token.request

    return true
  }

  public async consumeEncryptionResponse(token: EncryptionResponse) {
    return true
  }
}
