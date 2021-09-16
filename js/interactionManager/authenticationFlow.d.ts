import { Authentication } from 'jolocom-lib/js/interactionTokens/authentication';
import { InteractionType } from 'jolocom-lib/js/interactionTokens/types';
import { Flow } from './flow';
import { AuthenticationFlowState, FlowType } from './types';
export declare class AuthenticationFlow extends Flow<Authentication> {
    state: AuthenticationFlowState;
    static type: FlowType;
    static firstMessageType: InteractionType;
    handleInteractionToken(token: Authentication, interactionType: string): Promise<boolean>;
    consumeAuthenticationRequest(token: Authentication): Promise<boolean>;
}
