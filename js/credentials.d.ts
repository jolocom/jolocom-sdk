import { CredentialDefinition, ClaimEntry, BaseMetadata, ISignedCredCreationArgs, ISignedCredentialAttrs, CredentialRenderTypes } from '@jolocom/protocol-ts';
import { QueryOptions, IStorage, CredentialQuery } from './storage';
import { SignedCredential } from 'jolocom-lib/js/credentials/signedCredential/signedCredential';
import { Agent } from './agent';
import { ObjectKeeper, CredentialMetadataSummary, IdentitySummary } from './types';
import { IResolver } from 'jolocom-lib/js/didMethods/types';
import { SDKError } from './errors';
export interface DisplayVal {
    label?: string;
    key?: string;
    value?: string;
}
export interface CredentialDisplay {
    type: string[];
    issuerProfile?: IdentitySummary;
    name: string;
    schema: string;
    styles: CredentialDefinition['styles'];
    display: {
        properties: DisplayVal[];
        title?: DisplayVal;
        subtitle?: DisplayVal;
        description?: DisplayVal;
    };
}
export declare class CredentialType {
    readonly type: string[];
    readonly renderAs: CredentialRenderTypes;
    readonly issuerProfile?: IdentitySummary;
    readonly definition: CredentialDefinition;
    constructor(type: string[], metadata?: CredentialMetadataSummary);
    summary(): CredentialMetadataSummary;
    display(claim: ClaimEntry): CredentialDisplay;
    private _processDisplayMapping;
}
export declare class CredentialTypeKeeper implements ObjectKeeper<CredentialType, CredentialMetadataSummary, CredentialQuery> {
    protected credKeeper: CredentialKeeper;
    protected storage: IStorage;
    constructor(credKeeper: CredentialKeeper, storage: IStorage);
    buildId(issuer: string, credentialType: string | string[]): string;
    getFullCredentialTypeList(credType: string | string[]): string[];
    getByIssuerAndType(issuerDid: string, credType: string | string[]): Promise<CredentialType>;
    get(id: string, issuerDid?: string, fullCredType?: string | string[]): Promise<CredentialType>;
    create(meta: CredentialMetadataSummary): Promise<CredentialType>;
    forCredential(cred: SignedCredential): Promise<CredentialType>;
    export(query?: CredentialQuery, options?: QueryOptions): Promise<CredentialMetadataSummary[]>;
    import(data: CredentialMetadataSummary[]): Promise<[CredentialMetadataSummary, SDKError][]>;
}
export declare class CredentialKeeper implements ObjectKeeper<SignedCredential, ISignedCredCreationArgs<any>, CredentialQuery, ISignedCredentialAttrs> {
    protected storage: IStorage;
    protected resolver: IResolver;
    readonly types: CredentialTypeKeeper;
    private _applyFilter;
    constructor(storage: IStorage, resolver: IResolver, filter?: CredentialQuery | (() => CredentialQuery));
    /**
     * Retrieves a Signed Credential by id, or throws
     *
     * @param credParams - credential attributes
     * @returns SignedCredential instance
     * @category Credential Management
     */
    get(id: string): Promise<SignedCredential>;
    query(attrs?: CredentialQuery, options?: QueryOptions): Promise<SignedCredential[]>;
    export(query?: CredentialQuery, options?: QueryOptions): Promise<ISignedCredentialAttrs[]>;
    import(data: ISignedCredentialAttrs[]): Promise<[ISignedCredentialAttrs, SDKError][]>;
    delete(attrs?: CredentialQuery): Promise<boolean>;
    display(cred: SignedCredential): Promise<CredentialDisplay>;
    verify(cred: SignedCredential | ISignedCredentialAttrs): Promise<boolean>;
}
export declare class CredentialIssuer extends CredentialKeeper {
    private agent;
    constructor(agent: Agent, filter?: CredentialQuery | (() => CredentialQuery));
    /**
     * Creates, signs and persists a Credential.
     *
     * @param credParams - credential attributes
     * @returns SignedCredential instance
     * @throws Error on credential claim with 'null' or 'undefined' value
     * @category Credential Management
     */
    create<T extends BaseMetadata>(credParams: ISignedCredCreationArgs<T>): Promise<SignedCredential>;
    /**
     * Persists signed credential to the storage.
     *
     * @param credential - signed credential
     * @returns void
     * @category Credential Management
     */
    persist(credential: SignedCredential): Promise<void>;
    /**
     * Creates and signs a Credential.
     *
     * @param credParams - credential attributes
     * @returns SignedCredential instance
     * @throws Error on credential claim with 'null' or 'undefined' value
     * @category Credential Management
     */
    issue<T extends BaseMetadata>(credParams: ISignedCredCreationArgs<T>): Promise<SignedCredential>;
    private assertClaimValueDefined;
}
