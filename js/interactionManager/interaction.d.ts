import { CredentialOfferResponseSelection } from 'jolocom-lib/js/interactionTokens/types';
import { JSONWebToken } from 'jolocom-lib/js/interactionTokens/JSONWebToken';
import { InteractionSummary, InteractionRole, EncryptionResponse, DecryptionResponse, SigningResponse } from './types';
import { Flow } from './flow';
import { Identity } from 'jolocom-lib/js/identity/identity';
import { InteractionManager } from './interactionManager';
import { SignedCredential } from 'jolocom-lib/js/credentials/signedCredential/signedCredential';
import { CredentialOfferFlow } from './credentialOfferFlow';
import { CredentialRequestFlow } from './credentialRequestFlow';
import { AuthenticationFlow } from './authenticationFlow';
import { AuthorizationFlow } from './authorizationFlow';
import { EstablishChannelFlow } from './establishChannelFlow';
import { EncryptionFlow } from './encryptionFlow';
import { DecryptionFlow } from './decryptionFlow';
import { SigningFlow } from './signingFlow';
import { ResolutionFlow } from './resolutionFlow';
import { TransportAPI } from '../types';
import { Transportable } from '../transports';
import { CredentialQuery } from '../storage';
export declare const flows: (typeof AuthenticationFlow | typeof AuthorizationFlow | typeof CredentialOfferFlow | typeof CredentialRequestFlow | typeof EstablishChannelFlow | typeof SigningFlow | typeof EncryptionFlow | typeof DecryptionFlow | typeof ResolutionFlow)[];
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
export declare class Interaction<F extends Flow<any> = Flow<any>> extends Transportable {
    static getTypes(): any[];
    static getRequestTokenType(interxnType: string): any;
    static getFlowForType(interxnType: string): any;
    private messages;
    /**
     * The `id` is currently the {@link JSONWebToken.nonce} of the first token
     */
    id: string;
    ctx: InteractionManager;
    flow: F;
    /**
     * A map of all interaction participants to {@link jolocom-lib/js/identity/identity#Identity} objects. This is
     * incrementally built up as the interaction receives new messages.
     */
    participants: {
        [k in InteractionRole]?: Identity;
    };
    role?: InteractionRole;
    /**
     * @param ctx - The manager of this interaction
     * @param transportAPI - reference to an open transport to reach the
     *                       {@link Interaction.participants}
     * @param id - A unique identifier for this interaction
     * @param interactionType - the {@link InteractionType} of this interaction,
     *    which must match one of the known initial flow message types registered
     *    in {@link interactionFlowForMessage}
     */
    constructor(ctx: InteractionManager, id: string, interactionType: string, transportAPI?: TransportAPI);
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
    static fromMessages<F extends Flow<any>>(messages: Array<JSONWebToken<any>>, ctx: InteractionManager, id: string, transportAPI?: TransportAPI): Promise<Interaction<F>>;
    get firstMessage(): JSONWebToken<any>;
    get lastMessage(): JSONWebToken<any>;
    getMessages(): JSONWebToken<any>[];
    private findMessageByType;
    get counterparty(): Identity | undefined;
    /**
     * @category Auth
     */
    createAuthenticationResponse(): Promise<JSONWebToken<any>>;
    /**
     * @category Establish Channel
     */
    createEstablishChannelResponse(transportIdx: number): Promise<JSONWebToken<{
        transportIdx: number;
    }>>;
    createResolutionResponse(): Promise<JSONWebToken<{
        '@context': string;
        didDocument: import("@jolocom/protocol-ts").IDidDocumentAttrs;
        resolverMetadata: {
            driverId: string;
            driver: string;
            retrieved: number;
        };
        methodMetadata: {
            stateProof: string;
        };
    }>>;
    /**
     * @category Auth
     */
    createAuthorizationResponse(): Promise<JSONWebToken<{
        description: string;
    } | {
        description: string;
    } | {
        imageURL: string;
        description: string;
    } | {
        description: string;
    } | {
        action: string;
        description: string;
    } | {
        description: string;
    } | {
        action: string;
        description: string;
    } | {
        imageURL: string;
        description: string;
    } | {
        action: string;
        imageURL: string;
        description: string;
    }>>;
    /**
     * @category Credential Share
     */
    createCredentialResponse(selectedCredentials: string[]): Promise<JSONWebToken<any>>;
    /**
     * @category Credential Offer
     */
    createCredentialOfferResponseToken(selectedOffering: CredentialOfferResponseSelection[]): Promise<JSONWebToken<any>>;
    /**
     * @category Credential Offer
     */
    issueSelectedCredentials(offerMap?: {
        [k: string]: (inp?: any) => Promise<{
            claim: any;
            metadata?: any;
            subject?: string;
        }>;
    }): Promise<SignedCredential[]>;
    /**
     * @category Credential Offer
     */
    createCredentialReceiveToken(customCreds?: SignedCredential[]): Promise<JSONWebToken<any>>;
    private _processToken;
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
    processInteractionToken<T>(token: JSONWebToken<T>): Promise<boolean>;
    /**
     * @category Asymm Crypto
     */
    createEncResponseToken(): Promise<JSONWebToken<EncryptionResponse>>;
    /**
     * @category Asymm Crypto
     */
    createDecResponseToken(): Promise<JSONWebToken<DecryptionResponse>>;
    /**
     * @category Asymm Crypto
     */
    createSigningResponseToken(): Promise<JSONWebToken<SigningResponse>>;
    getSummary(): InteractionSummary;
    getStoredCredentialById(id: string): Promise<SignedCredential[]>;
    getVerifiableCredential(query?: CredentialQuery): Promise<SignedCredential[]>;
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
    send<T>(token: JSONWebToken<T>): Promise<void>;
    private checkFlow;
    /**
     * @category Credential Offer
     */
    storeSelectedCredentials(): Promise<SignedCredential[]>;
    /**
     * @category Credential Offer
     */
    storeCredentialMetadata(): Promise<import("../credentials").CredentialType[]>;
}
