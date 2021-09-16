"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SigningType = exports.DecryptionType = exports.EncryptionType = exports.AuthorizationType = exports.EstablishChannelType = exports.FlowType = exports.InteractionRole = void 0;
var InteractionRole;
(function (InteractionRole) {
    InteractionRole["Requester"] = "requester";
    InteractionRole["Responder"] = "responder";
})(InteractionRole = exports.InteractionRole || (exports.InteractionRole = {}));
var FlowType;
(function (FlowType) {
    FlowType["Authentication"] = "Authentication";
    FlowType["CredentialShare"] = "CredentialShare";
    FlowType["CredentialOffer"] = "CredentialOffer";
    FlowType["Authorization"] = "Authorization";
    FlowType["EstablishChannel"] = "EstablishChannel";
    FlowType["Encrypt"] = "Encrypt";
    FlowType["Decrypt"] = "Decrypt";
    FlowType["Resolution"] = "Resolution";
    FlowType["Sign"] = "Sign";
})(FlowType = exports.FlowType || (exports.FlowType = {}));
var EstablishChannelType;
(function (EstablishChannelType) {
    EstablishChannelType["EstablishChannelRequest"] = "EstablishChannelRequest";
    EstablishChannelType["EstablishChannelResponse"] = "EstablishChannelResponse";
})(EstablishChannelType = exports.EstablishChannelType || (exports.EstablishChannelType = {}));
var AuthorizationType;
(function (AuthorizationType) {
    AuthorizationType["AuthorizationRequest"] = "AuthorizationRequest";
    AuthorizationType["AuthorizationResponse"] = "AuthorizationResponse";
})(AuthorizationType = exports.AuthorizationType || (exports.AuthorizationType = {}));
var EncryptionType;
(function (EncryptionType) {
    EncryptionType["EncryptionRequest"] = "EncryptionRequest";
    EncryptionType["EncryptionResponse"] = "EncryptionResponse";
})(EncryptionType = exports.EncryptionType || (exports.EncryptionType = {}));
var DecryptionType;
(function (DecryptionType) {
    DecryptionType["DecryptionRequest"] = "DecryptionRequest";
    DecryptionType["DecryptionResponse"] = "DecryptionResponse";
})(DecryptionType = exports.DecryptionType || (exports.DecryptionType = {}));
var SigningType;
(function (SigningType) {
    SigningType["SigningRequest"] = "SigningRequest";
    SigningType["SigningResponse"] = "SigningResponse";
})(SigningType = exports.SigningType || (exports.SigningType = {}));
//# sourceMappingURL=types.js.map