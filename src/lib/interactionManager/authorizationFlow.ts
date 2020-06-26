import { Flow } from './flow'
import { FlowType } from './types'

export enum AuthorizationType {
  AuthorizationRequest = 'authorizationRequest',
  AuthorizationResponse = 'authorizationResponse',
}

export interface AuthorizationResponse {
  description: string
  imageURL?: string
  action?: string
}

export interface AuthorizationRequest extends AuthorizationResponse {
  callbackURL: string
}

export interface AuthorizationFlowState {
  description: string
  imageURL?: string
  action?: string
}

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
        return this.consumeAuthorizationRequest(token as AuthorizationRequest)
      case AuthorizationType.AuthorizationResponse:
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
    //TODO add logic that checks if the request data matches the response
    return true
  }
}
