import { Flow } from './flow';
import { FlowType } from './types';
import { ResolutionResult } from '../resolution';
export declare enum ResolutionType {
    ResolutionRequest = "ResolutionRequest",
    ResolutionResponse = "ResolutionResponse"
}
export interface ResolutionRequest {
    description?: string;
    uri?: string;
    callbackURL?: string;
}
export interface ResolutionFlowState {
    request?: ResolutionRequest;
    resolution_result?: ResolutionResult;
}
export declare const isResolutionRequest: (t: any, typ: string) => t is ResolutionRequest;
export declare const isResolutionResponse: (t: any, typ: string) => t is ResolutionResult;
export declare class ResolutionFlow extends Flow<ResolutionRequest | ResolutionResult> {
    static type: FlowType;
    state: ResolutionFlowState;
    static firstMessageType: ResolutionType;
    handleInteractionToken(token: ResolutionRequest | ResolutionResult, interactionType: string): Promise<boolean>;
}
