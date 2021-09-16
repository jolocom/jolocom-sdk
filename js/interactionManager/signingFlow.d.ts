/// <reference types="node" />
import { Interaction } from './interaction';
import { Flow, FlowState } from './flow';
import { SigningRequest, SigningResponse, FlowType, SigningType } from './types';
export interface SigningFlowState extends FlowState {
    request?: SigningRequest;
    signature?: Buffer;
}
export declare class SigningFlow extends Flow<SigningRequest | SigningResponse> {
    state: SigningFlowState;
    static type: FlowType;
    static firstMessageType: SigningType;
    constructor(ctx: Interaction);
    handleInteractionToken(token: SigningRequest | SigningResponse, tokenType: string): Promise<boolean>;
    consumeSigningRequest(token: SigningRequest): Promise<boolean>;
    consumeSigningResponse(token: SigningResponse): Promise<boolean>;
}
