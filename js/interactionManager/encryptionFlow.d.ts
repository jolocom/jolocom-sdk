/// <reference types="node" />
import { Interaction } from './interaction';
import { Flow, FlowState } from './flow';
import { EncryptionRequest, EncryptionResponse, FlowType, EncryptionType } from './types';
export interface EncryptionFlowState extends FlowState {
    request?: EncryptionRequest;
    encryptedData?: Buffer;
}
export declare class EncryptionFlow extends Flow<EncryptionRequest | EncryptionResponse> {
    static type: FlowType;
    state: EncryptionFlowState;
    static firstMessageType: EncryptionType;
    constructor(ctx: Interaction);
    handleInteractionToken(token: EncryptionRequest | EncryptionResponse, interactionType: string): Promise<boolean>;
    consumeEncryptionRequest(token: EncryptionRequest): Promise<boolean>;
    consumeEncryptionResponse(token: EncryptionResponse): Promise<boolean>;
}
