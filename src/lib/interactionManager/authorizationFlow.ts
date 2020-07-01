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
    imageURL: '',
    action: '',
  }

  public handleInteractionToken(
    token: AuthorizationRequest | AuthorizationResponse,
    interactionType: string,
  ) {
    switch (interactionType) {
      case AuthorizationType.AuthorizationRequest:
        if (isAuthorizationRequest(token, interactionType))
          return this.consumeAuthorizationRequest(token)
      case AuthorizationType.AuthorizationResponse:
        if (isAuthorizationResponse(token, interactionType))
          return this.consumeAuthorizationResponse(token)
      default:
        throw new Error('Interaction type not found')
    }
  }

  public async consumeAuthorizationRequest(request: AuthorizationRequest) {
    if (!this.state.description) this.state.description = request.description
    if (!this.state.imageURL && request.imageURL)
      this.state.imageURL = request.imageURL
    if (!this.state.action && request.action) this.state.action = request.action
    return true
  }

  public async consumeAuthorizationResponse(response: AuthorizationResponse) {
    const { description, imageURL, action } = this.state

    const isValidDesc = description === response.description
    const isValidImageURL = imageURL?.length
      ? imageURL === response.imageURL
      : true
    const isValidAction = action?.length ? action === response.action : true

    return isValidDesc && isValidAction && isValidImageURL
  }
}
