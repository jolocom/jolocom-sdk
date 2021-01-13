import { Interaction } from './interaction'
import { Flow, FlowState } from './flow'
import {
  EncryptionRequest,
  EncryptionResponse,
  FlowType,
  EncryptionType,
} from './types'
import { isEncryptionRequest, isEncryptionResponse } from './guards'

export interface EncryptionFlowState extends FlowState {
  request?: EncryptionRequest
  encryptedData?: Buffer
}

export class EncryptionFlow extends Flow<
  EncryptionRequest | EncryptionResponse
  > {
  public type = FlowType.Encrypt
  public state: EncryptionFlowState = {}
  public static firstMessageType = EncryptionType.EncryptionRequest

  public constructor(ctx: Interaction) {
    super(ctx)
  }

  public async handleInteractionToken(
    token: EncryptionRequest | EncryptionResponse,
    interactionType: string,
  ) {
    switch (interactionType) {
      case EncryptionType.EncryptionRequest:
        if (isEncryptionRequest(token, interactionType)) {
          return this.consumeEncryptionRequest(token)
        }
      case EncryptionType.EncryptionResponse:
        if (isEncryptionResponse(token, interactionType)) {
          return this.consumeEncryptionResponse(token)
        }
      default:
        throw new Error('Interaction type not found')
    }
  }

  public async consumeEncryptionRequest(token: EncryptionRequest) {
    if (this.state.request) return false // FIXME throw
    this.state.request = token
    return true
  }

  public async consumeEncryptionResponse(token: EncryptionResponse) {
    this.state.encryptedData = Buffer.from(token.result, 'base64')
    return true
  }
}
