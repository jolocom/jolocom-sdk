import { Flow } from './flow';
import { FlowType, AuthorizationResponse, AuthorizationRequest, AuthorizationType, AuthorizationFlowState } from './types';
export declare class AuthorizationFlow extends Flow<AuthorizationResponse | AuthorizationRequest> {
    static type: FlowType;
    state: AuthorizationFlowState;
    static firstMessageType: AuthorizationType;
    handleInteractionToken(token: AuthorizationRequest | AuthorizationResponse, interactionType: string): Promise<boolean>;
    consumeAuthorizationRequest(request: AuthorizationRequest): Promise<boolean>;
    consumeAuthorizationResponse(response: AuthorizationResponse): Promise<boolean>;
}
