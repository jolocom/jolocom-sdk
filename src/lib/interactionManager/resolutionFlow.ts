import { Flow } from './flow'
import { FlowType } from './types'
import { JSONWebToken } from '../../..'

import { ResolutionResult } from '../resolution'

export enum ResolutionType {
  ResolutionRequest = 'ResolutionRequest',
  ResolutionResponse = 'ResolutionResponse',
}

export interface ResolutionFlowState {
  requested: string
  resolution_result?: ResolutionResult
}

export interface ResolutionRequest {
  uri: string
}

export const isResolutionRequest = (t: any): t is ResolutionRequest =>
  t && t.uri && typeof t.uri === 'string'

export const isResolutionResponse = (
  t: any,
  typ: string,
): t is ResolutionResult => typ === ResolutionType.ResolutionResponse

export class ResolutionFlow extends Flow<ResolutionRequest | ResolutionResult> {
  public type = FlowType.Resolution
  public state: ResolutionFlowState = { requested: '' }

  public async handleInteractionToken(
    token: JSONWebToken<ResolutionRequest | ResolutionResult>,
  ): Promise<boolean> {
    console.log('res')
    return true
  }

  public async onValidMessage(
    token: ResolutionRequest | ResolutionResult,
    interactionType: string,
  ) {
    switch (interactionType) {
      case ResolutionType.ResolutionRequest:
        if (isResolutionRequest(token)) {
          this.state.requested = token.uri
          return true
        }
        return false
      case ResolutionType.ResolutionResponse:
        if (isResolutionResponse(token, interactionType)) {
          this.state.resolution_result = token
          return true
        }
        return false
    }
    throw new Error('Interaction type not found')
  }
}
