"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DecryptionFlow = void 0;
const flow_1 = require("./flow");
const types_1 = require("./types");
const guards_1 = require("./guards");
class DecryptionFlow extends flow_1.Flow {
    constructor(ctx) {
        super(ctx);
        this.state = {};
    }
    async handleInteractionToken(token, interactionType) {
        switch (interactionType) {
            case types_1.DecryptionType.DecryptionRequest:
                if (guards_1.isDecryptionRequest(token, interactionType)) {
                    return this.consumeDecryptionRequest(token);
                }
            case types_1.DecryptionType.DecryptionResponse:
                if (guards_1.isDecryptionResponse(token, interactionType)) {
                    return this.consumeDecryptionResponse(token);
                }
            default:
                throw new Error('Interaction type not found');
        }
    }
    async consumeDecryptionRequest(token) {
        if (this.state.request)
            return false; // FIXME throw
        this.state.request = token;
        return true;
    }
    async consumeDecryptionResponse(token) {
        this.state.decryptedData = Buffer.from(token.result, 'base64');
        return true;
    }
}
exports.DecryptionFlow = DecryptionFlow;
DecryptionFlow.type = types_1.FlowType.Decrypt;
DecryptionFlow.firstMessageType = types_1.DecryptionType.DecryptionRequest;
//# sourceMappingURL=decryptionFlow.js.map