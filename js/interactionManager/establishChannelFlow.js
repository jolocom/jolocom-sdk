"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EstablishChannelFlow = void 0;
const flow_1 = require("./flow");
const types_1 = require("./types");
const guards_1 = require("./guards");
class EstablishChannelFlow extends flow_1.Flow {
    constructor(ctx) {
        super(ctx);
        this.state = {
            description: '',
            established: false,
        };
    }
    async handleInteractionToken(token, interactionType) {
        if (this.state.established)
            throw new Error('already established');
        if (guards_1.isEstablishChannelRequest(token, interactionType)) {
            return this.consumeEstablishChannelRequest(token);
        }
        if (guards_1.isEstablishChannelResponse(token, interactionType)) {
            return this.consumeEstablishChannelResponse(token);
        }
        throw new Error('Interaction type not found');
    }
    async consumeEstablishChannelRequest(token) {
        if (this.state.established)
            throw new Error('already established');
        this.state.description = token.description;
        this.state.transports = token.transports;
        return true;
    }
    async consumeEstablishChannelResponse(token) {
        if (!this.state.transports)
            throw new Error('no transports yet!');
        this.state.transport = this.state.transports[token.transportIdx];
        if (!this.state.transport) {
            throw new Error('no transport at index ' + token.transportIdx + '.');
        }
        // TODO ensure that transport is actually successfully established
        this.state.established = true;
        return true;
    }
}
exports.EstablishChannelFlow = EstablishChannelFlow;
EstablishChannelFlow.type = types_1.FlowType.EstablishChannel;
EstablishChannelFlow.firstMessageType = types_1.EstablishChannelType.EstablishChannelRequest;
//# sourceMappingURL=establishChannelFlow.js.map