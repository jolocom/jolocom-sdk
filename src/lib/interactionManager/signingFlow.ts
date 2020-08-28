import { Interaction } from './interaction'
import { Flow, FlowState } from './flow'
import { isSigningRequest, isSigningResponse } from './guards'
import { CallType, SigningRequest, SigningResponse } from './rpc'
import { FlowType } from './types'

export interface SigningFlowState extends FlowState {
  request: Buffer,
  signature?: Buffer
}

export class SigningFlow extends Flow<SigningRequest | SigningResponse> {
  public state: SigningFlowState = {
    request: Buffer.from("")
  }

  public type = FlowType.Sign

  public constructor(ctx: Interaction) {
    super(ctx)
  }

  public onValidMessage(
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
    if (!this.state.request) this.state.request = Buffer.from(token.request, 'base64')

    return true
  }

  public async consumeSigningResponse(token: SigningResponse) {
    this.state.signature = Buffer.from(token.result, 'base64')
    return true
  }
}
