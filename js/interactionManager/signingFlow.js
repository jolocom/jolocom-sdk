"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SigningFlow = void 0;
const flow_1 = require("./flow");
const guards_1 = require("./guards");
const types_1 = require("./types");
class SigningFlow extends flow_1.Flow {
    constructor(ctx) {
        super(ctx);
        this.state = {};
    }
    async handleInteractionToken(token, tokenType) {
        switch (tokenType) {
            case types_1.SigningType.SigningRequest:
                if (guards_1.isSigningRequest(token, tokenType)) {
                    return this.consumeSigningRequest(token);
                }
            case types_1.SigningType.SigningResponse:
                if (guards_1.isSigningResponse(token, tokenType)) {
                    return this.consumeSigningResponse(token);
                }
            default:
                throw new Error('Interaction type not found');
        }
    }
    async consumeSigningRequest(token) {
        if (this.state.request)
            return false; // FIXME throw
        this.state.request = token;
        return true;
    }
    async consumeSigningResponse(token) {
        this.state.signature = Buffer.from(token.result, 'base64');
        return true;
    }
}
exports.SigningFlow = SigningFlow;
SigningFlow.type = types_1.FlowType.Sign;
SigningFlow.firstMessageType = types_1.SigningType.SigningRequest;
//# sourceMappingURL=signingFlow.js.map