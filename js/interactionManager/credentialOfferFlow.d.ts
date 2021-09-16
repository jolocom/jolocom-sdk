import { CredentialOfferRequest } from 'jolocom-lib/js/interactionTokens/credentialOfferRequest';
import { CredentialOfferResponse } from 'jolocom-lib/js/interactionTokens/credentialOfferResponse';
import { CredentialsReceive } from 'jolocom-lib/js/interactionTokens/credentialsReceive';
import { InteractionType } from '@jolocom/protocol-ts';
import { Flow } from './flow';
import { Interaction } from './interaction';
import { CredentialOfferFlowState, IssuanceResult, FlowType } from './types';
import { CredentialMetadataSummary } from '../types';
export declare class CredentialOfferFlow extends Flow<CredentialOfferRequest | CredentialOfferResponse | CredentialsReceive> {
    state: CredentialOfferFlowState;
    static type: FlowType;
    static firstMessageType: InteractionType;
    constructor(ctx: Interaction);
    handleInteractionToken(token: CredentialOfferRequest | CredentialOfferResponse | CredentialsReceive, interactionType: string): Promise<boolean>;
    private handleOfferRequest;
    private areTypesOffered;
    private handleOfferResponse;
    private handleCredentialReceive;
    getSelectionResult(): string[];
    getIssuanceResult(): IssuanceResult;
    getOfferDisplay(): import("../credentials").CredentialDisplay[];
    getOfferedCredentialMetadata(): Record<string, CredentialMetadataSummary>;
}
