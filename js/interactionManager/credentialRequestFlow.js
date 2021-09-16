"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CredentialRequestFlow = void 0;
const types_1 = require("jolocom-lib/js/interactionTokens/types");
const flow_1 = require("./flow");
const types_2 = require("./types");
const guards_1 = require("./guards");
class CredentialRequestFlow extends flow_1.Flow {
    constructor(ctx) {
        super(ctx);
        this.state = {
            constraints: [],
            providedCredentials: [],
        };
    }
    /*
     * Implementation of the abstract handler defined in {@link Flow}
     * Given an interaction token, will fire the appropriate step in the protocol or throw
     */
    async handleInteractionToken(token, interactionType) {
        switch (interactionType) {
            case types_1.InteractionType.CredentialRequest:
                if (guards_1.isCredentialRequest(token)) {
                    return this.handleCredentialRequest(token);
                }
            case types_1.InteractionType.CredentialResponse:
                if (guards_1.isCredentialResponse(token)) {
                    return this.handleCredentialResponse(token);
                }
            default:
                throw new Error('Interaction type not found');
        }
    }
    async handleCredentialRequest(request) {
        this.state.constraints.push(request);
        return true;
    }
    async handleCredentialResponse(token) {
        this.state.providedCredentials.push(token);
        const lastIndex = this.state.constraints.length - 1;
        if (lastIndex >= 0) {
            return token.satisfiesRequest(this.state.constraints[lastIndex]);
        }
        else
            return true;
    }
}
exports.CredentialRequestFlow = CredentialRequestFlow;
CredentialRequestFlow.type = types_2.FlowType.CredentialShare;
CredentialRequestFlow.firstMessageType = types_1.InteractionType.CredentialRequest;
//# sourceMappingURL=credentialRequestFlow.js.map