import { JSONWebToken } from 'jolocom-lib/js/interactionTokens/JSONWebToken';
import { Interaction } from './interaction';
import { Agent } from '../agent';
import { Flow } from './flow';
import { TransportAPI } from '../types';
import { FlowType } from './types';
import { Emitter } from '../events';
export interface InteractionEvents {
    interactionCreated: (interxn: Interaction) => void;
    interactionUpdated: (interxn: Interaction) => void;
}
/**
 * The {@link InteractionManager} is an entry point to dealing with {@link
 * Interaction}s. It also manages {@link InteractionTransport}s by extending
 * {@link Transportable}.  It is meant to be instantiated in context of a {@link
 * JolocomSDK} instance.
 *
 * Interactions are not serialized or fetched from storage, only the
 * interaction tokens ({@link JSONWebToken}). Currently the `InteractionManager`
 * holds a map of all interactions in memory, keyed by ID (which is just the
 * nonce of the first {@link JSONWebToken}).
 *
 *
 * @category Interactions
 */
export declare class InteractionManager extends Emitter<InteractionEvents> {
    readonly ctx: Agent;
    interactions: {
        [NONCE: string]: Interaction<Flow<any>>;
    };
    constructor(ctx: Agent);
    start<F extends Flow<any>>(token: JSONWebToken<any>, transportAPI?: TransportAPI): Promise<Interaction<F>>;
    /**
     * Returns an {@link Interaction} instance by ID, if there is one in memory.
     * Otherwise tries to reconstruct the Interaction from tokens that were
     * previously processed through the SDK (and thus committed to storage).
     *
     * @param id - the interaction ID
     * @param transportAPI - transportAPI to use in case trying to load the
     *                       interaction from storage
     * @throws SDKError(ErrorCode.NoSuchInteraction) if not found
     */
    getInteraction<F extends Flow<any>>(id: string, transportAPI?: TransportAPI): Promise<Interaction<Flow<any>>>;
    /**
     * Returns a list of {@link Interaction} instances given filtering and
     * pagination criteria
     *
     * @param flows - a list of {@link FlowType}s or Flow classes
     * @param take - number of results to return (pagination limit)
     * @param skip - number of results to skip (pagination offset)
     * @param reverse - if true, return the list in reverse storage order
     */
    listInteractions<T>(opts?: {
        flows?: Array<FlowType | {
            firstMessageType: string;
            type: string;
        }>;
        take?: number;
        skip?: number;
        reverse?: boolean;
    }): Promise<Interaction[]>;
}
