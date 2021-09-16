"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JolocomSDK = exports.ErrorCode = exports.SDKError = void 0;
const tslib_1 = require("tslib");
const jolocom_lib_1 = require("jolocom-lib");
const errors_1 = require("./errors");
Object.defineProperty(exports, "SDKError", { enumerable: true, get: function () { return errors_1.SDKError; } });
Object.defineProperty(exports, "ErrorCode", { enumerable: true, get: function () { return errors_1.ErrorCode; } });
var storage_1 = require("./storage");
Object.defineProperty(exports, "NaivePasswordStore", { enumerable: true, get: function () { return storage_1.NaivePasswordStore; } });
var jolocom_lib_2 = require("jolocom-lib");
Object.defineProperty(exports, "JolocomLib", { enumerable: true, get: function () { return jolocom_lib_2.JolocomLib; } });
var JSONWebToken_1 = require("jolocom-lib/js/interactionTokens/JSONWebToken");
Object.defineProperty(exports, "JSONWebToken", { enumerable: true, get: function () { return JSONWebToken_1.JSONWebToken; } });
const didMethodKeeper_1 = require("./didMethodKeeper");
const local_1 = require("jolocom-lib/js/didMethods/local");
const agent_1 = require("./agent");
const transports_1 = require("./transports");
const credentials_1 = require("./credentials");
const types_1 = require("./types");
const util_1 = require("./util");
var agent_2 = require("./agent");
Object.defineProperty(exports, "Agent", { enumerable: true, get: function () { return agent_2.Agent; } });
const twitter_1 = require("./plugins/twitter");
tslib_1.__exportStar(require("./types"), exports);
var interaction_1 = require("./interactionManager/interaction");
Object.defineProperty(exports, "Interaction", { enumerable: true, get: function () { return interaction_1.Interaction; } });
var types_2 = require("./interactionManager/types");
Object.defineProperty(exports, "FlowType", { enumerable: true, get: function () { return types_2.FlowType; } });
class JolocomSDK {
    constructor(conf) {
        this.didMethods = new didMethodKeeper_1.DidMethodKeeper();
        this.transports = new transports_1.TransportKeeper();
        this.storage = conf.storage;
        const localDidMethod = new local_1.LocalDidMethod(conf.eventDB || this.storage.eventDB);
        this.didMethods.register('jun', localDidMethod);
        this.usePlugins(new twitter_1.TwitterPlugin());
        // FIXME the prefix bit is required just to match IResolver
        // but does anything need it at that level?
        this.resolver = { prefix: '', resolve: this.resolve.bind(this) };
        this.credentials = new credentials_1.CredentialKeeper(this.storage, this.resolver);
        // if we are running on NodeJS, then autoconfig some things if possible
        if (process && process.version)
            this._autoconfigForNodeJS();
    }
    _autoconfigForNodeJS() {
        try {
            const fetch = require('node-fetch');
            this.transports.http.configure({ fetch });
        }
        catch (err) {
            // pass, it's ok
        }
        /*
         * Note this is disabled because it breaks metro bundler
         *
        try {
          const WebSocket = require('ws')
          this.transports.ws.configure({ WebSocket })
        } catch (err) {
          // pass, it's ok
        }
        */
    }
    /**
     * Resolve a DID string such as `did:method:123456789abcdef0` to an Identity,
     * looking through storage cache first, then using the appropriate DIDMethod
     * of the {@link DidMethodKeeper}
     *
     * @param did string the did to resolve
     * @returns the resolved identity
     */
    async resolve(did) {
        const cached = await this.storage.get.identity(did);
        if (!cached) {
            const resolved = await this.didMethods
                .getForDid(did)
                .resolver.resolve(did);
            await this.storage.store.identity(resolved).catch(err => {
                console.error('Failed to store Identity after resolving', err);
            });
            return resolved;
        }
        return cached;
    }
    _makePassStore(passOrStore) {
        if (typeof passOrStore === 'string') {
            return { getPassword: async () => passOrStore };
        }
        else if (passOrStore && passOrStore.getPassword) {
            return passOrStore;
        }
        return;
    }
    /**
     * Create an Agent instance without any identity
     *
     * @param passOrStore - A password as string or {@link IPasswordStore}
     * @param didMethodName - The name of a DID method registered on this Agent's
     *                        SDK instance
     * @category Agent
     */
    _makeAgent(passOrStore, didMethodName) {
        const passwordStore = this._makePassStore(passOrStore);
        const didMethod = didMethodName
            ? this.didMethods.get(didMethodName)
            : this.didMethods.getDefault();
        return new agent_1.Agent({
            sdk: this,
            passwordStore,
            didMethod,
        });
    }
    /**
     * Create an Agent instance with a newly registered Identity, and persist it
     * to storage
     *
     * @param passOrStore - A password as string or {@link IPasswordStore}
     * @param didMethodName - The name of a DID method registered on this Agent's
     *                        SDK instance
     * @category Agent
     */
    async createAgent(passOrStore, didMethodName) {
        const agent = this._makeAgent(passOrStore, didMethodName);
        await agent.createNewIdentity();
        return agent;
    }
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
    async createAgentFromMnemonic(mnemonic, shouldOverwrite = false, passOrStore, didMethodName) {
        const agent = this._makeAgent(passOrStore, didMethodName);
        await agent.createFromMnemonic(mnemonic, shouldOverwrite);
        return agent;
    }
    /**
     * Create an Agent instance with an Identity loaded from storage
     *
     * @param passOrStore - A password as string or {@link IPasswordStore}
     * @param did - The DID of the Agent Identity to load
     * @category Agent
     */
    async loadAgent(passOrStore, did) {
        const didMethodName = did ? did.split(':')[1] : '';
        const agent = this._makeAgent(passOrStore, didMethodName);
        await agent.loadIdentity(did);
        return agent;
    }
    /**
     * Create an Agent instance with an Identity loaded from a mnemonic phrase
     *
     * @param mnemonic - A BIP39 phrase
     * @param passOrStore - A password as string or {@link IPasswordStore}
     * @param didMethodName - DID Method to use, or otherwise
     *                        {@link default | setDefaultDidMethod}
     * @category Agent
     */
    async loadAgentFromMnemonic(mnemonic, passOrStore, didMethodName) {
        const agent = this._makeAgent(passOrStore, didMethodName);
        await agent.loadFromMnemonic(mnemonic);
        return agent;
    }
    /**
     * Export Agent as a serializable JSON object
     *
     * @param agent - the agent to export
     * @param options - export options
     *
     * @category Agent
     */
    async exportAgent(agent, options) {
        options = util_1.getExportAgentOptions(options);
        let exagent = {
            version: types_1.EXPORT_SCHEMA_VERSION,
            did: agent.idw.did,
            timestamp: Date.now(),
            data: ''
        };
        const encryptedWalletInfo = await agent.storage.get.encryptedWallet(exagent.did);
        const interxnTokens = await agent.storage.get.interactionTokens();
        const exportedData = {
            encryptedWallet: encryptedWalletInfo === null || encryptedWalletInfo === void 0 ? void 0 : encryptedWalletInfo.encryptedWallet,
        };
        if (options.credentials) {
            exportedData.credentials = await agent.credentials.export();
            exportedData.credentialsMetadata = await agent.credentials.types.export();
        }
        if (options.interactions) {
            exportedData.interactionTokens = interxnTokens.map(t => t.encode());
        }
        const agentData = Buffer.from(JSON.stringify(exportedData));
        exagent.data = agentData.toString('base64');
        return exagent;
    }
    /**
     * Import a previously exported Agent, adding its data to the database and
     * loading it immediately
     *
     * @param exagent - the exported agent to export
     * @param options - import options, including password
     *
     * @category Agent
     */
    async importAgent(exagent, options) {
        options = util_1.getExportAgentOptions(options);
        const agentData = JSON.parse(Buffer.from(exagent.data, 'base64').toString());
        let encryptedWallet = await this.storage.get.encryptedWallet(exagent.did);
        if (!encryptedWallet) {
            if (!agentData.encryptedWallet)
                throw new errors_1.SDKError(errors_1.ErrorCode.NoWallet);
            await this.storage.store.encryptedWallet({
                id: exagent.did,
                timestamp: exagent.timestamp,
                encryptedWallet: agentData.encryptedWallet
            });
        }
        const agent = await this.loadAgent(options.password, exagent.did);
        // TODO: check for rejected imports
        if (agentData.credentialsMetadata)
            await agent.credentials.types.import(agentData.credentialsMetadata);
        if (agentData.credentials)
            await agent.credentials.import(agentData.credentials);
        if (agentData.interactions) {
            throw new Error('todo'); // TODO
        }
        if (agentData.interactionTokens) {
            // TODO add batch insert support on storage
            await Promise.all(agentData.interactionTokens.map(jwt => {
                const token = jolocom_lib_1.JolocomLib.parse.interactionToken.fromJWT(jwt);
                return agent.storage.store.interactionToken(token);
            }));
            // TODO return rejected stuff?
        }
        return agent;
    }
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
    async initAgent({ password, passwordStore, did, auto }) {
        const passOrStore = password || passwordStore;
        try {
            // NOTE: must 'await' here explicity for error handling to work correctly
            const agent = await this.loadAgent(passOrStore, did);
            return agent;
        }
        catch (err) {
            if (err.message !== errors_1.ErrorCode.NoWallet || auto === false) {
                throw err;
            }
        }
        return this.createAgent(passOrStore);
    }
    /**
     * Attach a plugin to the SDK
     *
     * @NOTE this is for internal use only currently
     */
    async usePlugins(...plugs) {
        const promises = plugs.map(p => p.register(this));
        await Promise.all(promises);
    }
    /**
     * Set the default DID method to use for creating/loading agents.
     * Note that it must already have been registered with
     * `sdk.didMethods.register`
     *
     * @category DID Method
     */
    setDefaultDidMethod(methodName) {
        const method = this.didMethods.get(methodName);
        this.didMethods.setDefault(method);
    }
    /**
     * Stores a DID Document and its corrosponding Key Provider
     *
     * @param id - Identity being Stored
     * @param skp - Key Provider for the Identity
     * @returns void
     */
    async storeIdentityData(id, skp) {
        if (id.did !== skp.id)
            throw new Error('Identity data inconsistent');
        await this.storage.store.encryptedWallet({
            id: skp.id,
            encryptedWallet: skp.encryptedWallet,
            timestamp: Date.now(),
        });
        await this.storage.store.identity(id);
    }
    /**
     * Deletes data associated with an identity
     *
     * @param did - Identity's DID
     * @param options - Delete options
     */
    async deleteAgent(did, options) {
        // TODO: add settings
        options = util_1.getDeleteAgentOptions(options);
        let identity = await this.resolve(did);
        if (options.encryptedWallet)
            await this.storage.delete.encryptedWallet(did);
        if (options.identity)
            await this.storage.delete.identity(did);
        if (options.credentials)
            await this.storage.delete.verifiableCredentials([
                { subject: did },
                { issuer: did },
            ]);
        if (options.interactions) {
            let query = [];
            identity.publicKeySection.forEach(pk => {
                let keyId = `${did}${pk.id}`;
                query.push({ initiator: keyId }, { responder: keyId });
            });
            await this.storage.delete.interactions(query);
        }
    }
}
exports.JolocomSDK = JolocomSDK;
//# sourceMappingURL=index.js.map