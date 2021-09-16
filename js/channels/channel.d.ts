import { InteractionSummary } from '../interactionManager/types';
import { JSONWebToken } from 'jolocom-lib/js/interactionTokens/JSONWebToken';
import { Interaction } from '../interactionManager/interaction';
import { ChannelKeeper } from './channelKeeper';
import { TransportAPI } from '../types';
import { Transportable } from '../transports';
export interface ChannelSummary {
    initialInteraction: InteractionSummary;
    interactions: InteractionSummary[];
}
export declare class Channel extends Transportable {
    ctx: ChannelKeeper;
    id: string;
    initialInteraction: Interaction;
    authPromise: Promise<boolean>;
    private _threads;
    private _threadIdList;
    private _started;
    private _startedPromise;
    private _resolveAuthPromise;
    constructor(ctx: ChannelKeeper, initialInteraction: Interaction, transportAPI?: TransportAPI);
    get counterparty(): import("jolocom-lib/js/identity/identity").Identity | undefined;
    get authenticated(): boolean;
    getSummary(): Promise<ChannelSummary>;
    send(msg: JSONWebToken<any>): Promise<void>;
    processJWT(jwt: string, transportAPI?: TransportAPI): Promise<Interaction<import("../interactionManager/flow").Flow<any>>>;
    private _ensureAuthenticated;
    start(onInterxnCb?: (interxn: Interaction) => Promise<void>): Promise<void>;
    stop(): void;
    startThread(tokenOrJwt: Interaction | JSONWebToken<any> | string): Promise<JSONWebToken<any>>;
}
