/// <reference types="node" />
import { Interaction } from './interaction';
import { Flow, FlowState } from './flow';
import { DecryptionRequest, DecryptionResponse, FlowType, DecryptionType } from './types';
export interface DecryptionFlowState extends FlowState {
    request?: DecryptionRequest;
    decryptedData?: Buffer;
}
export declare class DecryptionFlow extends Flow<DecryptionRequest | DecryptionResponse> {
    static type: FlowType;
    state: DecryptionFlowState;
    static firstMessageType: DecryptionType;
    constructor(ctx: Interaction);
    handleInteractionToken(token: DecryptionRequest | DecryptionResponse, interactionType: string): Promise<boolean>;
    consumeDecryptionRequest(token: DecryptionRequest): Promise<boolean>;
    consumeDecryptionResponse(token: DecryptionResponse): Promise<boolean>;
}
