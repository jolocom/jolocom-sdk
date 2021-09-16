"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Channel = void 0;
const interaction_1 = require("../interactionManager/interaction");
const jolocom_lib_1 = require("jolocom-lib");
const transports_1 = require("../transports");
class Channel extends transports_1.Transportable {
    constructor(ctx, initialInteraction, transportAPI) {
        super(transportAPI);
        this._threads = {};
        this._threadIdList = [];
        this._started = false;
        this._startedPromise = null;
        this.ctx = ctx;
        this.id = initialInteraction.id;
        this.initialInteraction = initialInteraction;
        this.authPromise = new Promise(resolve => {
            this._resolveAuthPromise = resolve;
        });
        // TODO for a "server" side, the interaction will not yet have a response
        //      and the server should wait till a response is received before
        //      setting it as authenticated
    }
    get counterparty() {
        return this.initialInteraction.counterparty;
    }
    get authenticated() {
        const flowState = this.initialInteraction.flow.getState();
        return flowState.established;
    }
    async getSummary() {
        const interactions = await Promise.all(this._threadIdList.map(async (qId) => {
            const interxn = await this.ctx.ctx.interactionManager.getInteraction(qId);
            return interxn && interxn.getSummary();
        }));
        return {
            initialInteraction: this.initialInteraction.getSummary(),
            interactions,
        };
    }
    send(msg) {
        return this.transportAPI.send(msg.encode());
    }
    async processJWT(jwt, transportAPI) {
        const interxn = await this.ctx.ctx.processJWT(jwt, transportAPI);
        if (interxn.id === this.id) {
            // this is the channel establishment response, update if necessary
            this.initialInteraction = interxn;
            // TODO check if response valid?
            if (this.authenticated) {
                this._resolveAuthPromise(true);
                return interxn;
            }
        }
        // TODO ~ @mnzaki
        // this is currently hardcoded to handle certain kinds of requests
        // the long term plan is to ask the App API "what next" and provide response
        // options
        //
        // the short term plan is to candycrush the `Interaction.create*Response()`
        // methods and have a simple `respond()` method that "just works" when there
        // are no inputs (arguments) needed
        //
        // const resp = await interxn.getOrCreateResponse()
        // TODO
        // some form of simple permission system so that the user knows what they
        // are consenting to when they open a channel
        this._ensureAuthenticated();
        const thread = this._threads[interxn.id];
        if (thread) {
            // TODO implicit assumption about message response
            const response = interxn.getMessages()[1];
            if (response && thread.resolve) {
                thread.response = response;
                thread.resolve(response);
            }
        }
        else {
            // TODO should thread be added in?
            //      note that 'thread' objects here are only useful to trigger
            //      thread resolution promises
        }
        return interxn;
    }
    _ensureAuthenticated() {
        if (!this.authenticated) {
            throw new Error('not authenticated'); // FIXME new errcode ChannelNotAuthenticated
        }
    }
    async start(onInterxnCb) {
        if (this._started)
            throw new Error('channel already started');
        this._startedPromise = (async () => {
            try {
                this._started = true;
                if (!this._transportAPI) {
                    const flowState = this.initialInteraction.flow.getState();
                    const transportConfig = flowState.transport;
                    if (!transportConfig)
                        throw new Error('no transport');
                    this.transportAPI = await this.ctx.ctx.sdk.transports.start(transportConfig, async (msg) => {
                        const interxn = await this.processJWT(msg, this.transportAPI);
                        onInterxnCb && onInterxnCb(interxn);
                    });
                }
                if (this.transportAPI.ready)
                    await this.transportAPI.ready;
            }
            catch (err) {
                this._started = false;
                throw err;
            }
        })();
        return this._startedPromise;
    }
    stop() {
        if (!this._started)
            return;
        this.transportAPI.stop && this.transportAPI.stop();
        this._started = false;
    }
    async startThread(tokenOrJwt) {
        let token;
        if (typeof tokenOrJwt === 'string') {
            token = jolocom_lib_1.JolocomLib.parse.interactionToken.fromJWT(tokenOrJwt);
        }
        else if (tokenOrJwt instanceof interaction_1.Interaction) {
            token = tokenOrJwt.firstMessage;
        }
        else {
            token = tokenOrJwt;
        }
        const qId = token.nonce;
        const thread = {};
        thread.promise = new Promise((resolve, reject) => {
            thread.resolve = resolve;
            thread.reject = reject;
            return this.send(token);
        });
        this._threads[qId] = thread;
        this._threadIdList.push(qId);
        // TODO add expiry mechanism to reject and delete query from memory once tokens expire
        return thread.promise;
    }
}
exports.Channel = Channel;
//# sourceMappingURL=channel.js.map