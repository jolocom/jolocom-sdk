"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InteractionManager = void 0;
const interaction_1 = require("./interaction");
const errors_1 = require("../errors");
const events_1 = require("../events");
const firstMessageForFlowType = {};
interaction_1.flows.forEach((f) => {
    firstMessageForFlowType[f.type] = f.firstMessageType;
});
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
class InteractionManager extends events_1.Emitter {
    constructor(ctx) {
        super();
        this.ctx = ctx;
        this.interactions = {};
    }
    async start(token, transportAPI) {
        const interaction = new interaction_1.Interaction(this, token.nonce, token.interactionType, transportAPI);
        this.interactions[token.nonce] = interaction;
        await interaction.processInteractionToken(token);
        await this.ctx.storage.store.interactionToken(token);
        return interaction;
    }
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
    async getInteraction(id, transportAPI) {
        // NOTE FIXME TODO
        // should getInteraction be taking a transportAPI argument?
        // what if the transportAPI is specified but interaction is loaded from
        // memory?
        // should getInteraction be instantiating new interactions like this?
        // should there be a separate loadInteraction method?
        // if there's an interaction instance, we return it
        if (this.interactions[id])
            return this.interactions[id];
        // otherwise we try to reconstruct the interaction object from the stored
        // interaction messages
        const messages = await this.ctx.storage.get.interactionTokens({ nonce: id });
        if (messages.length === 0)
            throw new errors_1.SDKError(errors_1.ErrorCode.NoSuchInteraction);
        const interxn = await interaction_1.Interaction.fromMessages(messages, this, id, transportAPI);
        this.interactions[id] = interxn;
        return interxn;
    }
    /**
     * Returns a list of {@link Interaction} instances given filtering and
     * pagination criteria
     *
     * @param flows - a list of {@link FlowType}s or Flow classes
     * @param take - number of results to return (pagination limit)
     * @param skip - number of results to skip (pagination offset)
     * @param reverse - if true, return the list in reverse storage order
     */
    async listInteractions(opts) {
        let queryOpts = opts && {
            take: opts.take,
            skip: opts.skip,
            ...(opts.reverse && { order: { id: 'DESC' } }),
        };
        const attrs = opts &&
            opts.flows &&
            opts.flows.map((f) => ({
                type: typeof f === 'string' ? f : f.type,
            }));
        const ids = await this.ctx.storage.get.interactionIds(attrs, queryOpts);
        return Promise.all(ids.map((id) => this.getInteraction(id)));
    }
}
exports.InteractionManager = InteractionManager;
//# sourceMappingURL=interactionManager.js.map