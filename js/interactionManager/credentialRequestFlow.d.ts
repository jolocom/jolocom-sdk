import { InteractionType } from 'jolocom-lib/js/interactionTokens/types';
import { CredentialRequest } from 'jolocom-lib/js/interactionTokens/credentialRequest';
import { Interaction } from './interaction';
import { Flow } from './flow';
import { CredentialResponse } from 'jolocom-lib/js/interactionTokens/credentialResponse';
import { CredentialRequestFlowState, FlowType } from './types';
export declare class CredentialRequestFlow extends Flow<CredentialRequest | CredentialResponse> {
    state: CredentialRequestFlowState;
    static type: FlowType;
    static firstMessageType: InteractionType;
    constructor(ctx: Interaction);
    handleInteractionToken(token: CredentialRequest | CredentialResponse, interactionType: string): Promise<boolean>;
    private handleCredentialRequest;
    private handleCredentialResponse;
}
