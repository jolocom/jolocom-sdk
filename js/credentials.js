"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CredentialIssuer = exports.CredentialKeeper = exports.CredentialTypeKeeper = exports.CredentialType = void 0;
const protocol_ts_1 = require("@jolocom/protocol-ts");
const util_1 = require("./util");
const jolocom_lib_1 = require("jolocom-lib");
const signedCredential_1 = require("jolocom-lib/js/credentials/signedCredential/signedCredential");
const linkedData_1 = require("jolocom-lib/js/linkedData");
const errors_1 = require("./errors");
// TODO actually move into jolocom-lib??
class CredentialType {
    constructor(type, metadata) {
        var _a;
        this.type = type;
        this.definition = (metadata === null || metadata === void 0 ? void 0 : metadata.credential) || {};
        // NOTE: support for deprecated 'renderInfo'
        this.renderAs = ((_a = metadata === null || metadata === void 0 ? void 0 : metadata.renderInfo) === null || _a === void 0 ? void 0 : _a.renderAs) || protocol_ts_1.CredentialRenderTypes.claim;
        // TODO add check against schema in definition
        this.issuerProfile = metadata === null || metadata === void 0 ? void 0 : metadata.issuer;
    }
    summary() {
        return {
            type: this.type[1],
            issuer: this.issuerProfile,
            renderInfo: {
                renderAs: this.renderAs
            },
            credential: this.definition
        };
    }
    display(claim) {
        const display = {
            properties: [],
        };
        if (this.definition.display) {
            Object.keys(this.definition.display).forEach((k) => {
                const val = this.definition.display[k];
                if (Array.isArray(val)) {
                    // it's the 'properties' array
                    display[k] = val.map((dm) => this._processDisplayMapping(dm, claim));
                }
                else {
                    // one of 'title', 'subtitle', 'description'
                    display[k] = this._processDisplayMapping(val, claim);
                }
            });
        }
        return {
            type: this.type,
            issuerProfile: this.issuerProfile,
            name: this.definition.name || this.type.join(", "),
            schema: this.definition.schema || '',
            display: display,
            styles: {
                ...this.definition.styles,
            },
        };
    }
    _processDisplayMapping(dm, claim) {
        var _a;
        let value;
        const key = claim
            ? (_a = dm.path) === null || _a === void 0 ? void 0 : _a.find((p) => {
                // the paths are jsonpath
                value = util_1.jsonpath(p, claim);
                return value !== undefined;
            }) : undefined;
        return {
            label: dm.label,
            key,
            value: value !== undefined ? value : dm.text,
        };
    }
}
exports.CredentialType = CredentialType;
class CredentialTypeKeeper {
    constructor(credKeeper, storage) {
        this.credKeeper = credKeeper;
        this.storage = storage;
    }
    buildId(issuer, credentialType) {
        if (typeof credentialType === 'string') {
            return `${issuer}${credentialType}`;
        }
        return `${issuer}${credentialType[credentialType.length - 1]}`;
    }
    getFullCredentialTypeList(credType) {
        if (!credType)
            throw new Error('credential type required');
        // NOTE: 'VerifiableCredential' currently implied in the lib/protocol
        if (Array.isArray(credType)) {
            if (credType[0] !== 'VerifiableCredential') {
                return ['VerifiableCredential', ...credType];
            }
            else {
                return credType;
            }
        }
        else {
            return ['VerifiableCredential', credType];
        }
    }
    getByIssuerAndType(issuerDid, credType) {
        const fullCredType = this.getFullCredentialTypeList(credType);
        return this.get(this.buildId(issuerDid, fullCredType), issuerDid, fullCredType);
    }
    async get(id, issuerDid, fullCredType) {
        var _a, _b;
        const meta = await this.storage.get.credentialMetadataById(id);
        // NOTE: sometimes there's no issuer data stored...
        issuerDid = issuerDid || ((_a = meta.issuer) === null || _a === void 0 ? void 0 : _a.did);
        fullCredType = this.getFullCredentialTypeList(fullCredType || meta.type);
        if (!((_b = meta.issuer) === null || _b === void 0 ? void 0 : _b.publicProfile)) {
            try {
                meta.issuer = await this.storage.get.publicProfile(issuerDid);
            }
            catch (err) {
                console.error(`could not lookup issuer ${issuerDid}`, err);
                // pass
            }
        }
        return new CredentialType(fullCredType, meta);
    }
    async create(meta) {
        var _a;
        const fullCredType = this.getFullCredentialTypeList(meta.type);
        await this.storage.store.credentialMetadata(meta);
        if ((_a = meta.issuer) === null || _a === void 0 ? void 0 : _a.publicProfile) {
            await this.storage.store.issuerProfile(meta.issuer);
        }
        return new CredentialType(fullCredType, meta);
    }
    async forCredential(cred) {
        return this.getByIssuerAndType(cred.issuer, cred.type);
    }
    async export(query, options) {
        const creds = await this.credKeeper.query(query, options);
        const credTypes = await Promise.all(creds.map(c => this.forCredential(c)));
        return credTypes.map(credType => credType.summary());
    }
    async import(data) {
        const rejected = [];
        await Promise.all(data.map(async (credMeta) => {
            try {
                await this.create(credMeta);
            }
            catch (err) {
                console.error("credential metadata import failed", credMeta, err);
                // TODO better error breakdown
                err = err instanceof errors_1.SDKError ? err : new errors_1.SDKError(errors_1.ErrorCode.Unknown, err);
                rejected.push([credMeta, err]);
            }
        }));
        return rejected;
    }
}
exports.CredentialTypeKeeper = CredentialTypeKeeper;
class CredentialKeeper {
    constructor(storage, resolver, filter) {
        this.storage = storage;
        this.resolver = resolver;
        this.types = new CredentialTypeKeeper(this, this.storage);
        this._applyFilter = typeof filter === 'function' ? filter : () => filter;
    }
    /**
     * Retrieves a Signed Credential by id, or throws
     *
     * @param credParams - credential attributes
     * @returns SignedCredential instance
     * @category Credential Management
     */
    async get(id) {
        const creds = await this.query({ id });
        if (creds.length !== 1)
            throw new Error('multiple results for cred id ' + id);
        return creds[0];
    }
    async query(attrs, options) {
        const filterVals = this._applyFilter();
        return await this.storage.get.verifiableCredential({
            ...attrs,
            ...filterVals,
        });
    }
    async export(query, options) {
        const creds = await this.query(query, options);
        //const credTypes = await Promise.all(creds.map(c => this.getCredentialType(c)))
        //const metas = credTypes.map(credType => credType.summary())
        // NOTE: reversing here to make imports reproduce the same table order
        return creds.reverse().map(c => c.toJSON());
    }
    async import(data) {
        const rejected = [];
        await Promise.all(data.map(async (credJson) => {
            try {
                const signer = await this.resolver.resolve(credJson.issuer);
                const cred = await jolocom_lib_1.JolocomLib.parseAndValidate.signedCredential(credJson, signer);
                await this.storage.store.verifiableCredential(cred);
            }
            catch (err) {
                console.error("credential import failed", err);
                // TODO better error breakdown
                err = err instanceof errors_1.SDKError ? err : new errors_1.SDKError(errors_1.ErrorCode.Unknown, err);
                rejected.push([credJson, err]);
            }
        }));
        return rejected;
    }
    async delete(attrs) {
        // we use this.find to apply the filter if any
        const creds = await this.query(attrs);
        if (creds.length === 0)
            return false;
        await creds.map(({ id }) => this.storage.delete.verifiableCredential(id));
        return true;
    }
    async display(cred) {
        const credType = await this.types.forCredential(cred);
        return credType.display(cred.claim);
    }
    async verify(cred) {
        const issuer = await this.resolver.resolve(cred.issuer);
        const json = cred instanceof signedCredential_1.SignedCredential ? cred.toJSON() : cred;
        return linkedData_1.validateJsonLd(json, issuer);
    }
}
exports.CredentialKeeper = CredentialKeeper;
class CredentialIssuer extends CredentialKeeper {
    constructor(agent, filter) {
        super(agent.storage, agent.resolver, filter);
        this.agent = agent;
    }
    /**
     * Creates, signs and persists a Credential.
     *
     * @param credParams - credential attributes
     * @returns SignedCredential instance
     * @throws Error on credential claim with 'null' or 'undefined' value
     * @category Credential Management
     */
    async create(credParams) {
        const credential = await this.issue(credParams);
        await this.persist(credential);
        return credential;
    }
    /**
     * Persists signed credential to the storage.
     *
     * @param credential - signed credential
     * @returns void
     * @category Credential Management
     */
    async persist(credential) {
        // FIXME TODO: issuers currently can't store the cred in their DB because it
        // requires a foreign link to the subject... so only self-signed creds work
        // Otherwise it throws
        if (credential.issuer !== credential.subject) {
            console.warn('Credential persistence. Only self-signed credentials can be stored.');
            return;
        }
        await this.storage.store.verifiableCredential(credential);
    }
    /**
     * Creates and signs a Credential.
     *
     * @param credParams - credential attributes
     * @returns SignedCredential instance
     * @throws Error on credential claim with 'null' or 'undefined' value
     * @category Credential Management
     */
    async issue(credParams) {
        this.assertClaimValueDefined((credParams.claim || {}));
        return await this.agent.idw.create.signedCredential(credParams, await this.agent.passwordStore.getPassword());
    }
    assertClaimValueDefined(claim) {
        for (const [key, value] of Object.entries(claim)) {
            if (value === null || value === undefined) {
                throw new Error(`Credential issuance. Claim '${key}' value must be defined.`);
            }
        }
    }
}
exports.CredentialIssuer = CredentialIssuer;
//# sourceMappingURL=credentials.js.map