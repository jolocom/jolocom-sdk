"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EncryptionFlow = void 0;
const flow_1 = require("./flow");
const types_1 = require("./types");
const guards_1 = require("./guards");
class EncryptionFlow extends flow_1.Flow {
    constructor(ctx) {
        super(ctx);
        this.state = {};
    }
    async handleInteractionToken(token, interactionType) {
        switch (interactionType) {
            case types_1.EncryptionType.EncryptionRequest:
                if (guards_1.isEncryptionRequest(token, interactionType)) {
                    return this.consumeEncryptionRequest(token);
                }
            case types_1.EncryptionType.EncryptionResponse:
                if (guards_1.isEncryptionResponse(token, interactionType)) {
                    return this.consumeEncryptionResponse(token);
                }
            default:
                throw new Error('Interaction type not found');
        }
    }
    async consumeEncryptionRequest(token) {
        if (this.state.request)
            return false; // FIXME throw
        this.state.request = token;
        return true;
    }
    async consumeEncryptionResponse(token) {
        this.state.encryptedData = Buffer.from(token.result, 'base64');
        return true;
    }
}
exports.EncryptionFlow = EncryptionFlow;
EncryptionFlow.type = types_1.FlowType.Encrypt;
EncryptionFlow.firstMessageType = types_1.EncryptionType.EncryptionRequest;
//# sourceMappingURL=encryptionFlow.js.map