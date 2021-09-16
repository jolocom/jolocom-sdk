import { SoftwareKeyProvider } from 'jolocom-lib';
import { SDKError, ErrorCode } from './errors';
export { SDKError, ErrorCode };
import { IStorage, IPasswordStore } from './storage';
export { NaivePasswordStore } from './storage';
export { JolocomLib } from 'jolocom-lib';
export { JSONWebToken } from 'jolocom-lib/js/interactionTokens/JSONWebToken';
import { InternalDb } from '@jolocom/local-resolver-registrar/js/db';
import { DidMethodKeeper } from './didMethodKeeper';
import { IResolver } from 'jolocom-lib/js/didMethods/types';
import { Identity } from 'jolocom-lib/js/identity/identity';
import { Agent } from './agent';
import { TransportKeeper } from './transports';
import { CredentialKeeper } from './credentials';
import { DeleteAgentOptions, ExportAgentOptions, IExportedAgent } from './types';
export { Agent } from './agent';
export * from './types';
export { Interaction } from './interactionManager/interaction';
export { FlowType } from './interactionManager/types';
export interface IJolocomSDKConfig {
    storage: IStorage;
    eventDB?: InternalDb;
}
export interface IInitAgentOptions {
    password?: string;
    passwordStore?: IPasswordStore;
    did?: string;
    auto?: boolean;
}
export interface JolocomPlugin {
    register(sdk: JolocomSDK): Promise<void>;
}
export declare class JolocomSDK {
    didMethods: DidMethodKeeper;
    transports: TransportKeeper;
    storage: IStorage;
    credentials: CredentialKeeper;
    /**
     * The toplevel resolver which simply invokes {@link resolve}
     *
     * @see {@link resolve}
     */
    resolver: IResolver;
    constructor(conf: IJolocomSDKConfig);
    private _autoconfigForNodeJS;
    /**
     * Resolve a DID string such as `did:method:123456789abcdef0` to an Identity,
     * looking through storage cache first, then using the appropriate DIDMethod
     * of the {@link DidMethodKeeper}
     *
     * @param did string the did to resolve
     * @returns the resolved identity
     */
    resolve(did: string): Promise<Identity>;
    private _makePassStore;
    /**
     * Create an Agent instance without any identity
     *
     * @param passOrStore - A password as string or {@link IPasswordStore}
     * @param didMethodName - The name of a DID method registered on this Agent's
     *                        SDK instance
     * @category Agent
     */
    _makeAgent(passOrStore?: string | IPasswordStore, didMethodName?: string): Agent;
    /**
     * Create an Agent instance with a newly registered Identity, and persist it
     * to storage
     *
     * @param passOrStore - A password as string or {@link IPasswordStore}
     * @param didMethodName - The name of a DID method registered on this Agent's
     *                        SDK instance
     * @category Agent
     */
    createAgent(passOrStore?: string | IPasswordStore, didMethodName?: string): Promise<Agent>;
    /**
     * Create an Agent instance with a newly registered Identity based on entropy
     * from a BIP39 mnemonic, and persist it to storage
     *
     * @param mnemonic - A BIP39 phrase
     * @param shouldOverwrite - if true, overwrite any pre-existing identity in
     *                          storage (default false)
     * @param passOrStore - A password as string or {@link IPasswordStore}
     * @param didMethodName - DID Method to use, or otherwise
     *                        {@link default | setDefaultDidMethod}
     * @category Agent
     */
    createAgentFromMnemonic(mnemonic: string, shouldOverwrite?: boolean, passOrStore?: string | IPasswordStore, didMethodName?: string): Promise<Agent>;
    /**
     * Create an Agent instance with an Identity loaded from storage
     *
     * @param passOrStore - A password as string or {@link IPasswordStore}
     * @param did - The DID of the Agent Identity to load
     * @category Agent
     */
    loadAgent(passOrStore?: string | IPasswordStore, did?: string): Promise<Agent>;
    /**
     * Create an Agent instance with an Identity loaded from a mnemonic phrase
     *
     * @param mnemonic - A BIP39 phrase
     * @param passOrStore - A password as string or {@link IPasswordStore}
     * @param didMethodName - DID Method to use, or otherwise
     *                        {@link default | setDefaultDidMethod}
     * @category Agent
     */
    loadAgentFromMnemonic(mnemonic: string, passOrStore?: string | IPasswordStore, didMethodName?: string): Promise<Agent>;
    /**
     * Export Agent as a serializable JSON object
     *
     * @param agent - the agent to export
     * @param options - export options
     *
     * @category Agent
     */
    exportAgent(agent: Agent, options?: ExportAgentOptions): Promise<IExportedAgent>;
    /**
     * Import a previously exported Agent, adding its data to the database and
     * loading it immediately
     *
     * @param exagent - the exported agent to export
     * @param options - import options, including password
     *
     * @category Agent
     */
    importAgent(exagent: IExportedAgent, options?: ExportAgentOptions): Promise<Agent>;
    /**
     * Create an Agent instance with an Identity loaded from storage or create a
     * new Identity if not found.
     *
     * Note that if the identity is not found a new one will be created ignoring
     * the passed in `did` parameter.
     *
     * @param passOrStore - A password as string or {@link IPasswordStore}
     * @param did - The DID of the Agent Identity to try to load
     * @param auto - whether or not to create a new identity if not found
     *              (default: true)
     * @category Agent
     */
    initAgent({ password, passwordStore, did, auto }: IInitAgentOptions): Promise<Agent>;
    /**
     * Attach a plugin to the SDK
     *
     * @NOTE this is for internal use only currently
     */
    usePlugins(...plugs: JolocomPlugin[]): Promise<void>;
    /**
     * Set the default DID method to use for creating/loading agents.
     * Note that it must already have been registered with
     * `sdk.didMethods.register`
     *
     * @category DID Method
     */
    setDefaultDidMethod(methodName: string): void;
    /**
     * Stores a DID Document and its corrosponding Key Provider
     *
     * @param id - Identity being Stored
     * @param skp - Key Provider for the Identity
     * @returns void
     */
    storeIdentityData(id: Identity, skp: SoftwareKeyProvider): Promise<void>;
    /**
     * Deletes data associated with an identity
     *
     * @param did - Identity's DID
     * @param options - Delete options
     */
    deleteAgent(did: string, options?: DeleteAgentOptions): Promise<void>;
}
