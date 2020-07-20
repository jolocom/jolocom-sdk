import { Interaction } from './interaction'
import { Flow } from './flow'
import { FlowType } from './types'

import { ResolutionResult } from '../resolution'

export interface ResolutionRequest {
  uri: string
}

export const isResolutionRequest = (t: any): t is ResolutionRequest => {
  t && t.uri && typeof t.uri === 'string'
}

export class ResolutionFlow extends Flow<
  ResolutionRequest | ResolutionResponse
> {
  public type = FlowType.Resolution
  public state = {
    requested: '',
    resolution_result: ResolutionResult,
  }

  public async handleInteractionToken(
    token: ResolutionRequest | ResolutionResponse,
    interactionType: string,
  ) {
    switch (interactionType) {
      case 'ResolutionRequest':
        if (isResolutionRequest(token)) {
          this.state.requested = token.uri
          return true
        }
        return false
      case 'ResolutionResponse':
        if (isResolutionRequest(token)) {
          return false
        }
        this.state.resolution_result = token
        return true
    }
    throw new Error('Interaction type not found')
  }
}
