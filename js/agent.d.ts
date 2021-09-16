/// <reference types="node" />
import { IdentityWallet } from 'jolocom-lib/js/identityWallet/identityWallet';
import { IPasswordStore, IStorage } from './storage';
import { SoftwareKeyProvider } from 'jolocom-lib';
import { JolocomSDK, JSONWebToken, TransportAPI } from './index';
import { IDidMethod, IResolver } from 'jolocom-lib/js/didMethods/types';
import { InteractionManager } from './interactionManager/interactionManager';
import { ChannelKeeper } from './channels';
import { AuthorizationRequest, EstablishChannelRequest, DecryptionRequest, EncryptionRequest, SigningRequest } from './interactionManager/types';
import { Interaction } from './interactionManager/interaction';
import { ResolutionRequest } from './interactionManager/resolutionFlow';
import { ICredentialRequestAttrs, CredentialOfferRequestAttrs, ICredentialsReceiveAttrs, BaseMetadata, ISignedCredCreationArgs } from '@jolocom/protocol-ts';
import { Flow } from './interactionManager/flow';
import { Identity } from 'jolocom-lib/js/identity/identity';
import { CredentialRequest } from 'jolocom-lib/js/interactionTokens/credentialRequest';
import { CredentialOfferRequest } from 'jolocom-lib/js/interactionTokens/credentialOfferRequest';
import { CredentialsReceive } from 'jolocom-lib/js/interactionTokens/credentialsReceive';
import { Authentication } from 'jolocom-lib/js/interactionTokens/authentication';
import { CredentialIssuer } from './credentials';
import { DeleteAgentOptions, ExportAgentOptions, IExportedAgent } from './types';
/**
 * The `Agent` class mainly provides an abstraction around the {@link
 * IdentityWallet} and {@link InteractionManager} components. It provides glue
 * code for:
 * - Identities: create and load identities
 * - Interactions: find interactions, and process incoming tokens
 * - Interaction Requests: start interactions by creating a new request message
 * - Credential Issuance: issue credentials
 *
 *
 * The {@link JolocomSDK} has further convenience methods for Agent
 * construction: {@link JolocomSDK.createAgent},
 * {@link JolocomSDK.loadAgent}, {@link JolocomSDK.initAgent}
 */
export declare class Agent {
    interactionManager: InteractionManager;
    channels: ChannelKeeper;
    private _identityWallet;
    private _keyProvider;
    passwordStore: IPasswordStore;
    sdk: JolocomSDK;
    private _didMethod?;
    resolve: (did: string) => Promise<Identity>;
    resolver: IResolver;
    storage: IStorage;
    credentials: CredentialIssuer;
    constructor({ sdk, passwordStore, didMethod, }: {
        sdk: JolocomSDK;
        passwordStore?: IPasswordStore;
        didMethod?: IDidMethod;
    });
    /**
     * The DID method that this Agent was constructed with, or otherwise the SDK's
     * default DID method
     */
    get didMethod(): IDidMethod;
    /**
     * The Agent's IdentityWallet instance.
     *
     * @throws SDKError(ErrorCode.NoWallet) if there is none
     */
    get identityWallet(): IdentityWallet;
    /**
     * Shortcut for {@link identityWallet}
     */
    get idw(): IdentityWallet;
    /**
     * The Agent's KeyProvider instance.
     *
     * @throws SDKError(ErrorCode.NoKeyProvider) if there is none
     */
    get keyProvider(): SoftwareKeyProvider;
    /**
     * Create and store new Identity using the Agent's {@link didMethod}
     *
     * @returns the newly created {@link IdentityWallet}
     *
     * @category Identity Management
     */
    createNewIdentity(): Promise<IdentityWallet>;
    getAlsoKnownAs(): Promise<{}>;
    addAlsoKnownAs(didMethodName: string, didMethodArg: string): Promise<Identity>;
    /**
     * Load an Identity from storage, given its DID.
     *
     * If no DID is specified, the first Identity found in storage will be loaded.
     *
     * @param did - DID of Identity to be loaded from DB
     * @returns An IdentityWallet corrosponding to the given DID
     *
     * @category Identity Management
     */
    loadIdentity(did?: string): Promise<IdentityWallet>;
    /**
     * Loads an Identity based on a BIP39 mnemonic phrase
     *
     * @param mnemonic - a BIP39 mnemonic phrase to use
     * @returns An IdentityWallet holding an Identity created by the configured
     *          DID Method given the entropy encoded in the mnemonic phrase
     *
     * @category Identity Management
     */
    loadFromMnemonic(mnemonic: string): Promise<IdentityWallet>;
    /**
     * Creates and registers an Identity based on a BIP39 mnemonic phrase
     *
     * @param mnemonic - a BIP39 mnemonic phrase to use
     * @param shouldOverwrite - if true, overwrite any pre-existing identity in
     *                          storage (default false)
     * @returns An IdentityWallet holding an Identity created by the configured
     *          DID Method given the entropy encoded in the mnemonic phrase
     *
     * @category Identity Management
     */
    createFromMnemonic(mnemonic: string, shouldOverwrite?: boolean): Promise<IdentityWallet>;
    /**
     * Parses a recieved interaction token in JWT format and process it through
     * the interaction system, returning the corresponding Interaction
     *
     * @param jwt recieved jwt string or parsed JSONWebToken
     * @returns Promise<Interaction> the associated Interaction object
     * @throws AppError<InvalidToken> with `origError` set to the original token
     *                                validation error from the jolocom library
     *
     * @category Interaction Management
     */
    processJWT(jwt: JSONWebToken<any> | string, transportAPI?: TransportAPI): Promise<Interaction>;
    /**
     * Find an interaction, by id or by jwt, or by JSONWebToken object
     *
     * @param inp id, JWT string, or JSONWebToken object
     * @returns Promise<Interaction> the associated Interaction object
     * @category Interaction Management
     */
    findInteraction<F extends Flow<any>>(inp: string | JSONWebToken<any>): Promise<Interaction<F>>;
    /**
     * Creates a signed, base64 encoded Authentication Request, given a
     * callbackURL
     *
     * @param callbackURL - the callbackURL to which the Authentication Response
     *                      should be sent
     * @returns Base64 encoded signed Authentication Request
     * @category Interaction Requests
     */
    authRequestToken(auth: {
        callbackURL: string;
        description?: string;
    }): Promise<JSONWebToken<Authentication>>;
    /**
     * Creates a signed, base64 encoded Resolution Request, given a URI
     *
     * @param uri - URI to request resolution for
     * @returns Base64 encoded signed Resolution Request
     * @category Interaction Requests
     */
    resolutionRequestToken(req?: {
        description?: string;
        uri?: string;
        callbackURL?: string;
    }): Promise<JSONWebToken<ResolutionRequest>>;
    /**
     * Creates a signed, base64 encoded Authorization Request, given the request
     * attributes
     *
     * @param request - Authrization Request Attributes
     * @returns Base64 encoded signed Authentication Request
     * @category Interaction Requests
     */
    authorizationRequestToken(request: AuthorizationRequest): Promise<JSONWebToken<AuthorizationRequest>>;
    /**
     * Creates a signed, base64 encoded JWT for an EstablishChannelRequest interaction token
     *
     * @param request - EstablishChannelRequest Attributes
     * @returns Base64 encoded signed EstablishChannelRequest
     * @category Interaction Requests
     */
    establishChannelRequestToken(request: EstablishChannelRequest): Promise<JSONWebToken<EstablishChannelRequest>>;
    /**
     * Creates a signed, base64 encoded Credential Request, given a set of requirements
     *
     * @param request - Credential Request Attributes
     * @returns Base64 encoded signed credential request
     * @category Interaction Requests
     */
    credRequestToken(request: ICredentialRequestAttrs): Promise<JSONWebToken<CredentialRequest>>;
    /**
     * Returns a base64 encoded signed credential offer token, given
     * request attributes
     *
     * @param offer - credential offer attributes
     * @returns A base64 encoded signed credential offer token offering
     * credentials according to `offer`
     * @category Interaction Requests
     */
    credOfferToken(offer: CredentialOfferRequestAttrs): Promise<JSONWebToken<CredentialOfferRequest>>;
    /**
     * Returns a base64 encoded signed credential issuance token, given
     * issuance attributes and a recieved token selecting desired issuance
     *
     * @param issuance - credential issuance attributes
     * @param selection - base64 encoded credential offer response token
     * @returns A base64 encoded signed issuance token containing verifiable
     * credentials
     * @category Credential Management
     */
    credIssuanceToken(issuance: ICredentialsReceiveAttrs, selection: string): Promise<JSONWebToken<CredentialsReceive>>;
    /**
     * @category Interaction Requests
     */
    rpcDecRequest(req: {
        toDecrypt: Buffer;
        target?: string;
        callbackURL: string;
    }): Promise<JSONWebToken<DecryptionRequest>>;
    /**
     * @category Interaction Requests
     */
    rpcEncRequest(req: {
        toEncrypt: Buffer;
        target: string;
        callbackURL: string;
    }): Promise<JSONWebToken<EncryptionRequest>>;
    /**
     * @category Interaction Requests
     */
    signingRequest(req: {
        toSign: Buffer;
        callbackURL: string;
    }): Promise<JSONWebToken<SigningRequest>>;
    /**
     * Returns a Signed Credential
     *
     * @param credParams - credential attributes
     * @returns SignedCredential instance
     * @category Credential Management
     * @deprecated
     */
    signedCredential<T extends BaseMetadata>(credParams: ISignedCredCreationArgs<T>): Promise<import("jolocom-lib/js/credentials/signedCredential/signedCredential").SignedCredential>;
    /**
     * Returns the Proof of Control Authority for an Agent
     * the PCA is a DID Method specific set of data which
     * proves that the key holder also controls the Identifier
     *
     * @returns Control Proof string
     */
    getProofOfControlAuthority(): Promise<string>;
    delete(options?: DeleteAgentOptions): Promise<void>;
    export(opts?: ExportAgentOptions): Promise<IExportedAgent>;
    import(exagent: IExportedAgent, opts?: ExportAgentOptions): Promise<void>;
}
