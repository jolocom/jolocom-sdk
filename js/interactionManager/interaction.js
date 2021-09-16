"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Interaction = exports.flows = void 0;
const types_1 = require("jolocom-lib/js/interactionTokens/types");
const types_2 = require("./types");
const errors_1 = require("../errors");
const types_3 = require("./types");
const credentialOfferFlow_1 = require("./credentialOfferFlow");
const credentialRequestFlow_1 = require("./credentialRequestFlow");
const authenticationFlow_1 = require("./authenticationFlow");
const authorizationFlow_1 = require("./authorizationFlow");
const establishChannelFlow_1 = require("./establishChannelFlow");
const encryptionFlow_1 = require("./encryptionFlow");
const decryptionFlow_1 = require("./decryptionFlow");
const signingFlow_1 = require("./signingFlow");
const resolutionFlow_1 = require("./resolutionFlow");
const util_1 = require("../util");
const ramda_1 = require("ramda");
const types_4 = require("../types");
const transports_1 = require("../transports");
exports.flows = [
    authenticationFlow_1.AuthenticationFlow,
    authorizationFlow_1.AuthorizationFlow,
    credentialOfferFlow_1.CredentialOfferFlow,
    credentialRequestFlow_1.CredentialRequestFlow,
    establishChannelFlow_1.EstablishChannelFlow,
    signingFlow_1.SigningFlow,
    encryptionFlow_1.EncryptionFlow,
    decryptionFlow_1.DecryptionFlow,
    resolutionFlow_1.ResolutionFlow,
];
const interactionFlowForMessage = {};
const interactionFlowForFlowType = {};
exports.flows.forEach((f) => {
    interactionFlowForMessage[f.firstMessageType] = f;
    interactionFlowForFlowType[f.type] = f;
});
/**
 * This class is instantiated by the {@link InteractionManager} when it needs to
 * keep track of an ongoing interaction with another identity. It provides the
 * main API to respond to and get information about an ongoing interaction.
 *
 * Two identities interact by sending each other signed messages wrapped in
 * {@link JSONWebToken}. The messages have to have correct types and
 * follow the sequence expected by one of the predefined {@link Flow}s.
 *
 * {@link Interaction} objects hold a list of tokens exchanged in the
 * interaction, and an instance of the appropriate {@link Flow} class to handle
 * this interaction. Consumers of this object should generally not need to
 * directly interaction with the {@link Flow} instance.
 *
 */
class Interaction extends transports_1.Transportable {
    /**
     * @param ctx - The manager of this interaction
     * @param transportAPI - reference to an open transport to reach the
     *                       {@link Interaction.participants}
     * @param id - A unique identifier for this interaction
     * @param interactionType - the {@link InteractionType} of this interaction,
     *    which must match one of the known initial flow message types registered
     *    in {@link interactionFlowForMessage}
     */
    constructor(ctx, id, interactionType, transportAPI) {
        super(transportAPI);
        this.messages = [];
        /**
         * A map of all interaction participants to {@link jolocom-lib/js/identity/identity#Identity} objects. This is
         * incrementally built up as the interaction receives new messages.
         */
        this.participants = {};
        this.ctx = ctx;
        this.id = id;
        this.flow = new interactionFlowForMessage[interactionType](this);
    }
    static getTypes() {
        // @ts-ignore
        return Object.values(interactionFlowForMessage).map((v) => v.type);
    }
    static getRequestTokenType(interxnType) {
        var _a;
        return (_a = interactionFlowForFlowType[interxnType]) === null || _a === void 0 ? void 0 : _a.firstMessageType;
    }
    static getFlowForType(interxnType) {
        return interactionFlowForFlowType[interxnType];
    }
    /**
     * Returns an Interaction with state calculated from the given list of
     * messages. The messages are *not* committed to storage or validated in the
     * process, because this method is intended to be used to reload previously
     * stored interactions. See {@link InteractionManager.getInteraction}
     *
     * @param messages - List of messages to calculate interaction state from
     * @param ctx - The manager of this interaction
     * @param id - A unique identifier for this interaction
     * @param transportAPI - reference to an open transport to reach the
     *                       {@link Interaction.participants}
     */
    static async fromMessages(messages, ctx, id, transportAPI) {
        const firstToken = messages[0];
        const interaction = new Interaction(ctx, firstToken.nonce, firstToken.interactionType, transportAPI);
        // we process all the tokens sequentially, withot revalidating
        for (let message of messages) {
            await interaction._processToken(message, true);
        }
        return interaction;
    }
    get firstMessage() {
        if (this.messages.length < 1)
            throw new Error('Empty interaction');
        return this.messages[0];
    }
    get lastMessage() {
        if (this.messages.length < 1)
            throw new Error('Empty interaction');
        return this.messages[this.messages.length - 1];
    }
    getMessages() {
        return this.messages;
    }
    findMessageByType(type) {
        return this.getMessages().find(({ interactionType }) => interactionType === type);
    }
    get counterparty() {
        if (!this.role)
            return;
        const counterRole = this.role === types_2.InteractionRole.Requester
            ? types_2.InteractionRole.Responder
            : types_2.InteractionRole.Requester;
        return this.participants[counterRole];
    }
    // TODO Try to write a respond function that collapses these
    /**
     * @category Auth
     */
    async createAuthenticationResponse() {
        const request = this.findMessageByType(types_1.InteractionType.Authentication);
        const { description } = this.getSummary().state;
        const pca = await this.ctx.ctx
            .getProofOfControlAuthority()
            .then((pca) => ({ pca }))
            .catch((_) => ({}));
        return this.ctx.ctx.identityWallet.create.interactionTokens.response.auth({
            description,
            callbackURL: request.interactionToken.callbackURL,
            ...pca,
        }, await this.ctx.ctx.passwordStore.getPassword(), request);
    }
    /**
     * @category Establish Channel
     */
    async createEstablishChannelResponse(transportIdx) {
        const request = this.findMessageByType(types_2.EstablishChannelType.EstablishChannelRequest);
        const pca = await this.ctx.ctx
            .getProofOfControlAuthority()
            .then((pca) => ({ pca }))
            .catch((_) => ({}));
        return this.ctx.ctx.identityWallet.create.message({
            message: { transportIdx },
            typ: types_2.EstablishChannelType.EstablishChannelResponse,
            ...pca,
        }, await this.ctx.ctx.passwordStore.getPassword(), request);
    }
    async createResolutionResponse() {
        const request = this.findMessageByType(resolutionFlow_1.ResolutionType.ResolutionRequest);
        const reqMessage = this.flow.state.request;
        const uriToResolve = (reqMessage && reqMessage.uri) || this.ctx.ctx.idw.did;
        const pca = await this.ctx.ctx
            .getProofOfControlAuthority()
            .then((pca) => ({ pca }))
            .catch((_) => ({}));
        const stateId = ramda_1.last(uriToResolve.split(':')) || '';
        const stateProof = await this.ctx.ctx.storage.eventDB
            .read(stateId)
            .catch((_) => '');
        return this.ctx.ctx.identityWallet.create.message({
            message: {
                '@context': 'https://www.w3.org/ns/did-resolution/v1',
                didDocument: (await this.ctx.ctx.resolve(uriToResolve)).didDocument.toJSON(),
                resolverMetadata: {
                    driverId: this.ctx.ctx.identityWallet.did,
                    driver: 'jolocom/peer-resolution/0.1',
                    retrieved: Date.now(),
                },
                methodMetadata: { stateProof },
            },
            typ: resolutionFlow_1.ResolutionType.ResolutionResponse,
            ...pca,
        }, await this.ctx.ctx.passwordStore.getPassword(), request);
    }
    /**
     * @category Auth
     */
    async createAuthorizationResponse() {
        const request = this.findMessageByType(types_3.AuthorizationType.AuthorizationRequest);
        const { description, imageURL, action } = this.getSummary()
            .state;
        const pca = await this.ctx.ctx
            .getProofOfControlAuthority()
            .then((pca) => ({ pca }))
            .catch((_) => ({}));
        return this.ctx.ctx.identityWallet.create.message({
            message: {
                description,
                ...(imageURL && { imageURL }),
                ...(action && { action }),
            },
            typ: types_3.AuthorizationType.AuthorizationResponse,
            ...pca,
        }, await this.ctx.ctx.passwordStore.getPassword(), request);
    }
    /**
     * @category Credential Share
     */
    async createCredentialResponse(selectedCredentials) {
        const request = this.findMessageByType(types_1.InteractionType.CredentialRequest);
        const credentials = await Promise.all(selectedCredentials.map(async (id) => (await this.getVerifiableCredential({ id }))[0]));
        const pca = await this.ctx.ctx
            .getProofOfControlAuthority()
            .then((pca) => ({ pca }))
            .catch((_) => ({}));
        return this.ctx.ctx.identityWallet.create.interactionTokens.response.share({
            callbackURL: request.interactionToken.callbackURL,
            suppliedCredentials: credentials.map((c) => c.toJSON()),
            ...pca,
        }, await this.ctx.ctx.passwordStore.getPassword(), request);
    }
    /**
     * @category Credential Offer
     */
    async createCredentialOfferResponseToken(selectedOffering) {
        const credentialOfferRequest = this.findMessageByType(types_1.InteractionType.CredentialOfferRequest);
        const pca = await this.ctx.ctx
            .getProofOfControlAuthority()
            .then((pca) => ({ pca }))
            .catch((_) => ({}));
        const credentialOfferResponseAttr = {
            callbackURL: credentialOfferRequest.interactionToken.callbackURL,
            selectedCredentials: selectedOffering,
            ...pca,
        };
        return this.ctx.ctx.identityWallet.create.interactionTokens.response.offer(credentialOfferResponseAttr, await this.ctx.ctx.passwordStore.getPassword(), credentialOfferRequest);
    }
    /**
     * @category Credential Offer
     */
    async issueSelectedCredentials(offerMap) {
        const flowState = this.flow.state;
        return Promise.all(flowState.selectedTypes.map(async (type) => {
            var _a;
            const offerTypeHandler = offerMap && offerMap[type];
            const credDesc = offerTypeHandler && (await offerTypeHandler());
            const metadata = (credDesc && credDesc.metadata) || { context: [] };
            const subject = (credDesc && credDesc.subject) || ((_a = this.counterparty) === null || _a === void 0 ? void 0 : _a.did);
            if (!subject)
                throw new Error('no subject for credential');
            const claim = (credDesc && credDesc.claim) || {};
            return this.ctx.ctx.credentials.issue({
                metadata,
                claim,
                subject,
            });
        }));
    }
    /**
     * @category Credential Offer
     */
    async createCredentialReceiveToken(customCreds) {
        const creds = customCreds || (await this.issueSelectedCredentials());
        const request = this.findMessageByType(types_1.InteractionType.CredentialOfferResponse);
        return this.ctx.ctx.identityWallet.create.interactionTokens.response.issue({
            signedCredentials: creds.map((c) => c.toJSON()),
        }, await this.ctx.ctx.passwordStore.getPassword(), request);
    }
    async _processToken(token, fromStorage = false) {
        if (!this.participants.requester) {
            // TODO what happens if the signer isnt resolvable
            try {
                const requester = await this.ctx.ctx.resolve(token.signer.did);
                this.participants.requester = requester;
                if (requester.did === this.ctx.ctx.identityWallet.did) {
                    this.role = types_2.InteractionRole.Requester;
                }
            }
            catch (err) {
                console.error('error resolving requester', err);
            }
        }
        else if (!this.participants.responder) {
            try {
                const responder = await this.ctx.ctx.resolve(token.signer.did);
                this.participants.responder = responder;
                if (responder.did === this.ctx.ctx.identityWallet.did) {
                    this.role = types_2.InteractionRole.Responder;
                }
            }
            catch (err) {
                console.error('error resolving responder', err);
            }
        }
        if (!this._transportAPI) {
            // update transportAPI
            // @ts-ignore
            const { callbackURL } = token.interactionToken;
            if (callbackURL) {
                const transportDesc = {
                    type: types_4.InteractionTransportType.HTTP,
                    config: callbackURL,
                };
                const onMessage = async (msg) => {
                    // TODO throw on failure? processInteractionToken returns bool
                    await this.ctx.ctx.processJWT(msg);
                };
                this.transportAPI = await this.ctx.ctx.sdk.transports.start(transportDesc, onMessage);
            }
        }
        // TODO if handling fails, should we still be pushing the token??
        const res = await this.flow.handleInteractionToken(token.interactionToken, token.interactionType);
        this.messages.push(token);
        if (!fromStorage) {
            const eventName = this.messages.length === 1 ? 'interactionCreated' : 'interactionUpdated';
            this.ctx.emit(eventName, this);
        }
        return res;
    }
    /**
     * Validate an interaction token and process it to update the interaction
     * state (via the associated {@link Flow})
     *
     * @param token - the token to validate and process
     * @returns Promise<boolean> whether or not processing was successful
     * @throws SDKError<InvalidToken> with `origError` set to the original token
     *                                validation error from the jolocom library
     * @category Basic
     *
     */
    async processInteractionToken(token) {
        // verify
        try {
            await this.ctx.ctx.idw.validateJWT(token, this.messages.length
                ? this.messages[this.messages.length - 1]
                : undefined, this.ctx.ctx.resolver);
        }
        catch (err) {
            throw new errors_1.SDKError(errors_1.ErrorCode.InvalidToken, err);
        }
        return this._processToken(token);
    }
    /**
     * @category Asymm Crypto
     */
    async createEncResponseToken() {
        const encRequest = this.findMessageByType(types_2.EncryptionType.EncryptionRequest);
        const msg = encRequest.payload.interactionToken.request;
        const data = Buffer.from(encRequest.payload.interactionToken.request.data, 'base64');
        const targetParts = msg.target.split('#');
        let result;
        if (targetParts.length === 2) {
            // it includes a keyRef
            result = await this.ctx.ctx.identityWallet.asymEncryptToDidKey(data, msg.target, this.ctx.ctx.sdk.resolver);
        }
        else if (targetParts.length === 1) {
            // it does not include a keyRef
            result = await this.ctx.ctx.identityWallet.asymEncryptToDid(data, msg.target, this.ctx.ctx.sdk.resolver);
        }
        else {
            throw new Error('bad encryption target: ' + msg.target);
        }
        const pca = await this.ctx.ctx
            .getProofOfControlAuthority()
            .then((pca) => ({ pca }))
            .catch((_) => ({}));
        return this.ctx.ctx.identityWallet.create.message({
            message: {
                callbackURL: encRequest.payload.interactionToken.callbackURL,
                result: result.toString('base64'),
            },
            typ: types_2.EncryptionType.EncryptionResponse,
            ...pca,
        }, await this.ctx.ctx.passwordStore.getPassword(), encRequest);
    }
    /**
     * @category Asymm Crypto
     */
    async createDecResponseToken() {
        const decRequest = this.findMessageByType(types_2.DecryptionType.DecryptionRequest);
        const password = await this.ctx.ctx.passwordStore.getPassword();
        const pca = await this.ctx.ctx
            .getProofOfControlAuthority()
            .then((pca) => ({ pca }))
            .catch((_) => ({}));
        const data = Buffer.from(decRequest.payload.interactionToken.request.data, 'base64');
        const result = await this.ctx.ctx.identityWallet.asymDecrypt(data, password);
        return this.ctx.ctx.identityWallet.create.message({
            message: {
                result: result.toString('base64'),
            },
            typ: types_2.DecryptionType.DecryptionResponse,
            ...pca,
        }, password, decRequest);
    }
    /**
     * @category Asymm Crypto
     */
    async createSigningResponseToken() {
        const sigRequest = this.findMessageByType(types_2.SigningType.SigningRequest);
        const pass = await this.ctx.ctx.passwordStore.getPassword();
        const pca = await this.ctx.ctx
            .getProofOfControlAuthority()
            .then((pca) => ({ pca }))
            .catch((_) => ({}));
        return this.ctx.ctx.identityWallet.create.message({
            message: {
                result: (await this.ctx.ctx.identityWallet.sign(Buffer.from(sigRequest.payload.interactionToken.request.data, 'base64'), pass)).toString('base64'),
            },
            typ: types_2.SigningType.SigningResponse,
            ...pca,
        }, pass, sigRequest);
    }
    getSummary() {
        return {
            initiator: util_1.generateIdentitySummary(this.participants.requester),
            state: this.flow.getState(),
        };
    }
    async getStoredCredentialById(id) {
        return this.ctx.ctx.storage.get.verifiableCredential({
            id,
        });
    }
    async getVerifiableCredential(query) {
        return this.ctx.ctx.storage.get.verifiableCredential(query);
    }
    /**
     * @category Basic
     *
     * @dev This will crash with a credential receive because it doesn't contain a callbackURL
     * @todo This should probably come from the transport / channel handler
     * @todo Can this use the HttpAgent exported from instead of fetch? http.ts?
     * @todo The return type is difficult to pin down. If we're making a post, we expect a Response obejct,
     *   which either holds a token that can be parsed, or not (i.e. with credential responses, the answer from
     *   the server only holds the status code right now)
     *   If we're linking, the return value is a promise, as per {@see http://reactnative.dev/docs/linking.html#openurl}
     */
    async send(token) {
        return this.transportAPI.send(token.encode());
    }
    checkFlow(flow) {
        if (this.flow.type !== flow)
            throw new errors_1.SDKError(errors_1.ErrorCode.WrongFlow);
    }
    /**
     * @category Credential Offer
     */
    async storeSelectedCredentials() {
        this.checkFlow(types_2.FlowType.CredentialOffer);
        await this.storeCredentialMetadata();
        const { issued, credentialsValidity } = this.flow
            .state;
        if (!issued.length) {
            throw new errors_1.SDKError(errors_1.ErrorCode.SaveExternalCredentialFailed);
        }
        return Promise.all(issued
            .filter((cred, i) => credentialsValidity[i])
            .map(async (cred) => {
            await this.ctx.ctx.storage.store.verifiableCredential(cred);
            return cred;
        }));
    }
    /**
     * @category Credential Offer
     */
    async storeCredentialMetadata() {
        this.checkFlow(types_2.FlowType.CredentialOffer);
        const flow = this.flow;
        try {
            const metadatas = Object.values(await flow.getOfferedCredentialMetadata());
            return Promise.all(metadatas.map(metadata => this.ctx.ctx.credentials.types.create(metadata)));
        }
        catch (err) {
            console.error('storeCredentialMetadata failed', err);
            throw new errors_1.SDKError(errors_1.ErrorCode.SaveCredentialMetadataFailed, err);
        }
    }
}
exports.Interaction = Interaction;
//# sourceMappingURL=interaction.js.map