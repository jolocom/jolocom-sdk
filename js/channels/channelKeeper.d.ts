import { Interaction } from '../interactionManager/interaction';
import { Channel } from './channel';
import { Agent } from '../agent';
import { TransportAPI } from '../types';
export declare class ChannelKeeper {
    ctx: Agent;
    private _channels;
    constructor(ctx: Agent);
    get(id: string): Promise<Channel>;
    create(initInterxn: Interaction, transportAPI?: TransportAPI): Promise<Channel>;
    findByJWT(jwt: string): Promise<Channel>;
}
