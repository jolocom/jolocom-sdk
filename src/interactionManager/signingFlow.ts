import { Interaction } from './interaction'
import { Flow, FlowState } from './flow'
import { isSigningRequest, isSigningResponse } from './guards'
import { SigningRequest, SigningResponse, FlowType, SigningType } from './types'

export interface SigningFlowState extends FlowState {
  request?: SigningRequest
  signature?: Buffer
}

export class SigningFlow extends Flow<SigningRequest | SigningResponse> {
  public state: SigningFlowState = {}

  public type = FlowType.Sign
  public static firstMessageType = SigningType.SigningRequest

  public constructor(ctx: Interaction) {
    super(ctx)
  }

  public async handleInteractionToken(
    token: SigningRequest | SigningResponse,
    tokenType: string,
  ) {
    switch (tokenType) {
      case SigningType.SigningRequest:
        if (isSigningRequest(token, tokenType)) {
          return this.consumeSigningRequest(token)
        }
      case SigningType.SigningResponse:
        if (isSigningResponse(token, tokenType)) {
          return this.consumeSigningResponse(token)
        }
      default:
        throw new Error('Interaction type not found')
    }
  }

  public async consumeSigningRequest(token: SigningRequest) {
    if (this.state.request) return false // FIXME throw
    this.state.request = token
    return true
  }

  public async consumeSigningResponse(token: SigningResponse) {
    this.state.signature = Buffer.from(token.result, 'base64')
    return true
  }
}
