"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthorizationFlow = void 0;
const ramda_1 = require("ramda");
const flow_1 = require("./flow");
const types_1 = require("./types");
const guards_1 = require("./guards");
class AuthorizationFlow extends flow_1.Flow {
    constructor() {
        super(...arguments);
        this.state = {
            description: '',
        };
    }
    async handleInteractionToken(token, interactionType) {
        switch (interactionType) {
            case types_1.AuthorizationType.AuthorizationRequest:
                if (guards_1.isAuthorizationRequest(token, interactionType)) {
                    return this.consumeAuthorizationRequest(token);
                }
            case types_1.AuthorizationType.AuthorizationResponse:
                if (guards_1.isAuthorizationResponse(token, interactionType)) {
                    return this.consumeAuthorizationResponse(token);
                }
            default:
                throw new Error('Interaction type not found');
        }
    }
    async consumeAuthorizationRequest(request) {
        const { description, imageURL, action } = request;
        this.state = {
            description: description !== null && description !== void 0 ? description : this.state.description,
            ...(imageURL && { imageURL }),
            ...(action && { action }),
        };
        return true;
    }
    async consumeAuthorizationResponse(response) {
        if (!this.state.description.length)
            return false;
        return ramda_1.equals(this.state, response);
    }
}
exports.AuthorizationFlow = AuthorizationFlow;
AuthorizationFlow.type = types_1.FlowType.Authorization;
AuthorizationFlow.firstMessageType = types_1.AuthorizationType.AuthorizationRequest;
//# sourceMappingURL=authorizationFlow.js.map