import { Interaction } from './interaction';
import { FlowType } from './types';
import { InteractionType } from '@jolocom/protocol-ts/dist/lib/interactionTokens';
export interface FlowState {
}
export declare abstract class Flow<T> {
    protected ctx: Interaction;
    static type: FlowType;
    abstract state: FlowState;
    static firstMessageType: InteractionType | string;
    constructor(ctx: Interaction);
    get type(): FlowType;
    getState(): FlowState;
    abstract handleInteractionToken(message: T, messageType: string): Promise<boolean>;
}
