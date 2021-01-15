import { Flow } from './flow'
import { FlowType } from './types'

import { ResolutionResult } from '../resolution'

export enum ResolutionType {
  ResolutionRequest = 'ResolutionRequest',
  ResolutionResponse = 'ResolutionResponse',
}

export interface ResolutionRequest {
  description?: string
  uri?: string
  callbackURL?: string
}

export interface ResolutionFlowState {
  request?: ResolutionRequest
  resolution_result?: ResolutionResult
}

export const isResolutionRequest = (
  t: any,
  typ: string,
): t is ResolutionRequest => typ === ResolutionType.ResolutionRequest

export const isResolutionResponse = (
  t: any,
  typ: string,
): t is ResolutionResult => typ === ResolutionType.ResolutionResponse

export class ResolutionFlow extends Flow<ResolutionRequest | ResolutionResult> {
  public static type = FlowType.Resolution
  public state: ResolutionFlowState = {}
  public static firstMessageType = ResolutionType.ResolutionRequest

  public async handleInteractionToken(
    token: ResolutionRequest | ResolutionResult,
    interactionType: string,
  ) {
    if (isResolutionRequest(token, interactionType)) {
      this.state.request = token
    } else if (isResolutionResponse(token, interactionType)) {
      this.state.resolution_result = token
    } else {
      return false
    }
    return true
  }
}
