"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResolutionFlow = exports.isResolutionResponse = exports.isResolutionRequest = exports.ResolutionType = void 0;
const flow_1 = require("./flow");
const types_1 = require("./types");
var ResolutionType;
(function (ResolutionType) {
    ResolutionType["ResolutionRequest"] = "ResolutionRequest";
    ResolutionType["ResolutionResponse"] = "ResolutionResponse";
})(ResolutionType = exports.ResolutionType || (exports.ResolutionType = {}));
exports.isResolutionRequest = (t, typ) => typ === ResolutionType.ResolutionRequest;
exports.isResolutionResponse = (t, typ) => typ === ResolutionType.ResolutionResponse;
class ResolutionFlow extends flow_1.Flow {
    constructor() {
        super(...arguments);
        this.state = {};
    }
    async handleInteractionToken(token, interactionType) {
        if (exports.isResolutionRequest(token, interactionType)) {
            this.state.request = token;
        }
        else if (exports.isResolutionResponse(token, interactionType)) {
            this.state.resolution_result = token;
        }
        else {
            return false;
        }
        return true;
    }
}
exports.ResolutionFlow = ResolutionFlow;
ResolutionFlow.type = types_1.FlowType.Resolution;
ResolutionFlow.firstMessageType = ResolutionType.ResolutionRequest;
//# sourceMappingURL=resolutionFlow.js.map