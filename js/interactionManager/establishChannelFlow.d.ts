import { Interaction } from './interaction';
import { Flow } from './flow';
import { FlowType, EstablishChannelRequest, EstablishChannelResponse, EstablishChannelType, EstablishChannelFlowState } from './types';
export declare class EstablishChannelFlow extends Flow<EstablishChannelRequest | EstablishChannelResponse> {
    state: EstablishChannelFlowState;
    static type: FlowType;
    static firstMessageType: EstablishChannelType;
    constructor(ctx: Interaction);
    handleInteractionToken(token: EstablishChannelRequest | EstablishChannelResponse, interactionType: EstablishChannelType): Promise<boolean>;
    consumeEstablishChannelRequest(token: EstablishChannelRequest): Promise<boolean>;
    consumeEstablishChannelResponse(token: EstablishChannelResponse): Promise<boolean>;
}
