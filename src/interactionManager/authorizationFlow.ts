import { equals } from 'ramda'
import { Flow } from './flow'
import {
  FlowType,
  AuthorizationResponse,
  AuthorizationRequest,
  AuthorizationType,
  AuthorizationFlowState,
} from './types'
import { isAuthorizationRequest, isAuthorizationResponse } from './guards'

export class AuthorizationFlow extends Flow<
  AuthorizationResponse | AuthorizationRequest
> {
  public type = FlowType.Authorization
  public state: AuthorizationFlowState = {
    description: '',
  }

  public async handleInteractionToken(
    token: AuthorizationRequest | AuthorizationResponse,
    interactionType: string,
  ) {
    switch (interactionType) {
      case AuthorizationType.AuthorizationRequest:
        if (isAuthorizationRequest(token, interactionType)) {
          return this.consumeAuthorizationRequest(token)
        }
      case AuthorizationType.AuthorizationResponse:
        if (isAuthorizationResponse(token, interactionType)) {
          return this.consumeAuthorizationResponse(token)
        }
      default:
        throw new Error('Interaction type not found')
    }
  }

  public async consumeAuthorizationRequest(request: AuthorizationRequest) {
    if (!request.description) return false

    if (!this.state.description.length) {
      const { description, imageURL, action } = request
      this.state.description = description
      imageURL && (this.state.imageURL = imageURL)
      action && (this.state.action = action)
      return true
    }

    return false
  }

  public async consumeAuthorizationResponse(response: AuthorizationResponse) {
    if (!this.state.description.length) return false

    return equals(this.state, response)
  }
}
