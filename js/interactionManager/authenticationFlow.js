"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthenticationFlow = void 0;
const types_1 = require("jolocom-lib/js/interactionTokens/types");
const flow_1 = require("./flow");
const types_2 = require("./types");
const guards_1 = require("./guards");
class AuthenticationFlow extends flow_1.Flow {
    constructor() {
        super(...arguments);
        this.state = { description: '' };
    }
    // TODO InteractionType.AuthenticaitonResponse should exist
    async handleInteractionToken(token, interactionType) {
        // FIXME what's with this multilayer type checking
        switch (interactionType) {
            case types_1.InteractionType.Authentication:
                // FIXME there's already enough type information from the guard
                // These guards are necessary, the instanceof check can happen here
                // directly
                if (guards_1.isAuthenticationRequest(token)) {
                    return this.consumeAuthenticationRequest(token);
                }
            default:
                throw new Error('Interaction type not found');
        }
    }
    async consumeAuthenticationRequest(token) {
        if (!this.state.description)
            this.state.description = token.description;
        return this.state.description === token.description;
    }
}
exports.AuthenticationFlow = AuthenticationFlow;
AuthenticationFlow.type = types_2.FlowType.Authentication;
AuthenticationFlow.firstMessageType = types_1.InteractionType.Authentication;
//# sourceMappingURL=authenticationFlow.js.map