"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChannelKeeper = void 0;
const types_1 = require("../interactionManager/types");
const channel_1 = require("./channel");
class ChannelKeeper {
    constructor(ctx) {
        this._channels = {};
        this.ctx = ctx;
    }
    async get(id) {
        const ch = this._channels[id];
        if (!ch)
            throw new Error('no such channel: ' + JSON.stringify(id));
        return ch;
    }
    async create(initInterxn, transportAPI) {
        if (initInterxn.flow.type !== types_1.FlowType.EstablishChannel) {
            throw new Error('not an EstablishChannel interaction: ' + initInterxn.flow.type);
        }
        const ch = new channel_1.Channel(this, initInterxn, transportAPI);
        this._channels[ch.id] = ch;
        return ch;
    }
    async findByJWT(jwt) {
        const interxn = await this.ctx.findInteraction(jwt);
        const chId = interxn && interxn.flow.type === types_1.FlowType.EstablishChannel
            ? interxn.id
            : '';
        return this.get(chId);
    }
}
exports.ChannelKeeper = ChannelKeeper;
//# sourceMappingURL=channelKeeper.js.map