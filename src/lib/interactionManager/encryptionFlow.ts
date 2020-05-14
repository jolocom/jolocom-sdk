import { JWTEncodable } from 'jolocom-lib/js/interactionTokens/JSONWebToken'
import { InteractionType } from 'jolocom-lib/js/interactionTokens/types'
import { Interaction } from './interaction'
import { Flow } from './flow'
import { EncryptionFlowState } from './types'
import { isRPCRequest, isRPCResponse } from './guards'
import { RPCRequest, RPCResponse, CallType } from './rpc'

export class EncryptionFlow extends Flow {
  public state: EncryptionFlowState = {
    req: { rpc: CallType.AsymEncrypt, request: '' },
  }

  public constructor(ctx: Interaction) {
    super(ctx)
  }

  public handleInteractionToken(
    token: JWTEncodable,
    interactionType: InteractionType,
  ) {
    switch (interactionType) {
      case InteractionType.Authentication:
        if (isRPCRequest(token)) return this.consumeEncryptionRequest(token)
        else if (isRPCResponse(token))
          return this.consumeEncryptionResponse(token)
      default:
        throw new Error('Interaction type not found')
    }
  }

  public async consumeEncryptionRequest(token: RPCRequest) {
    if (!this.state.req.request) this.state.req = token.request

    return true
  }

  public async consumeEncryptionResponse(token: RPCResponse) {
    return true
  }
}
