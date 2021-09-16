"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CredentialOfferFlow = void 0;
const protocol_ts_1 = require("@jolocom/protocol-ts");
const jolocom_lib_1 = require("jolocom-lib");
const ramda_1 = require("ramda");
const credentials_1 = require("../credentials");
const flow_1 = require("./flow");
const types_1 = require("./types");
const guards_1 = require("./guards");
const util_1 = require("../util");
class CredentialOfferFlow extends flow_1.Flow {
    constructor(ctx) {
        super(ctx);
        this.state = {
            offerSummary: [],
            selection: [],
            selectedTypes: [],
            issued: [],
            credentialsValidity: [],
            credentialsAllValid: true,
        };
    }
    async handleInteractionToken(token, interactionType) {
        switch (interactionType) {
            case protocol_ts_1.InteractionType.CredentialOfferRequest:
                if (guards_1.isCredentialOfferRequest(token)) {
                    return this.handleOfferRequest(token);
                }
            case protocol_ts_1.InteractionType.CredentialOfferResponse:
                if (guards_1.isCredentialOfferResponse(token)) {
                    return this.handleOfferResponse(token);
                }
            case protocol_ts_1.InteractionType.CredentialsReceive:
                if (guards_1.isCredentialReceive(token)) {
                    return this.handleCredentialReceive(token);
                }
            default:
                throw new Error('Interaction type not found');
        }
    }
    handleOfferRequest(offer) {
        this.state.offerSummary = offer.offeredCredentials;
        return true;
    }
    areTypesOffered(types) {
        const { offerSummary } = this.state;
        if (!offerSummary)
            return false;
        return types.every(type => offerSummary.find(o => o.type == type));
    }
    async handleOfferResponse(token) {
        const selectedCreds = token.selectedCredentials;
        // First we check if all selected offers were actually offered
        const selectedTypes = selectedCreds.map(offer => offer.type);
        if (!this.areTypesOffered(selectedTypes)) {
            throw new Error('Invalid offer type in offer response');
        }
        // If all is good, then we update the 'selection' and 'selectedTypes' state,
        // and we keep them in the same order as the offer
        const selection = [];
        this.state.offerSummary.forEach(o => {
            const selected = selectedCreds.find(cred => cred.type === o.type);
            if (selected)
                selection.push(selected);
        });
        this.state.selection = selection;
        this.state.selectedTypes = selection.map(s => s.type);
        return true;
    }
    // Sets the state of issued credentials and their validity
    async handleCredentialReceive({ signedCredentials, }) {
        // First we check if all received credentials were actually offered
        const issuedTypes = signedCredentials.map(cred => ramda_1.last(cred.type) || '');
        if (!this.areTypesOffered(issuedTypes)) {
            throw new Error('Received wrong credentials');
        }
        // Then we compute the list of issued credential and their validity,
        // maintaining order as per the offer
        const issued = [];
        this.state.offerSummary.forEach(o => {
            const selected = signedCredentials.find(cred => ramda_1.last(cred.type) === o.type);
            if (selected)
                issued.push(selected);
        });
        this.state.issued = issued;
        const validArr = (this.state.credentialsValidity = await Promise.all(issued.map(async (cred) => {
            try {
                await jolocom_lib_1.JolocomLib.parseAndValidate.signedCredential(cred.toJSON(), await this.ctx.ctx.ctx.resolve(cred.issuer));
            }
            catch (e) {
                // credential signature is invalid!
                return false;
            }
            const validIssuer = cred.issuer === this.ctx.participants.requester.did;
            const validSubject = cred.subject === this.ctx.participants.responder.did;
            return validIssuer && validSubject;
        })));
        this.state.credentialsAllValid = validArr.every(v => v);
        return true;
    }
    // return a list of types which are both offered and requested
    getSelectionResult() {
        const offeredTypes = this.state.offerSummary.map(o => o.type);
        const selectedTypes = this.state.selection.map(s => s.type);
        return offeredTypes.filter(ot => selectedTypes.includes(ot));
    }
    getIssuanceResult() {
        return this.state.issued.map((cred, i) => {
            const offer = this.state.offerSummary.find(({ type }) => type === ramda_1.last(cred.type));
            if (!offer) {
                throw new Error('Received wrong credentials');
            }
            const validationErrors = {
                invalidIssuer: cred.issuer !== this.ctx.participants.requester.did,
                invalidSubject: cred.subject !== this.ctx.participants.responder.did,
            };
            return {
                ...offer,
                signedCredential: cred,
                validationErrors,
            };
        });
    }
    getOfferDisplay() {
        const metadatas = this.getOfferedCredentialMetadata();
        return this.state.offerSummary.map((oc, idx) => {
            var _a;
            const claim = (_a = this.state.issued[idx]) === null || _a === void 0 ? void 0 : _a.claim;
            // NOTE: currently CredentialOffer assumes a fixed value of the type array
            const fullType = ['VerifiableCredential', oc.type];
            const credType = new credentials_1.CredentialType(fullType, metadatas[oc.type]);
            return credType.display(claim);
        });
    }
    getOfferedCredentialMetadata() {
        const issuer = util_1.generateIdentitySummary(this.ctx.participants.requester);
        const metadatas = {};
        this.state.offerSummary.forEach(metadata => {
            metadatas[metadata.type] = {
                ...metadata,
                issuer,
            };
        });
        return metadatas;
    }
}
exports.CredentialOfferFlow = CredentialOfferFlow;
CredentialOfferFlow.type = types_1.FlowType.CredentialOffer;
CredentialOfferFlow.firstMessageType = protocol_ts_1.InteractionType.CredentialOfferRequest;
//# sourceMappingURL=credentialOfferFlow.js.map