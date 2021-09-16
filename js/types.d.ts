import { PublicProfileClaimMetadata, CredentialDefinition, ISignedCredentialAttrs } from '@jolocom/protocol-ts';
import { CredentialOfferRenderInfo, CredentialOfferMetadata } from 'jolocom-lib/js/interactionTokens/types';
import { QueryOptions } from './storage';
import { SDKError } from './errors';
/**
 * @dev Simply using all claims required by the public profile
 */
export declare type IssuerPublicProfileSummary = PublicProfileClaimMetadata['claimInterface'];
/**
 * @dev An identity summary is composed of a DID + all public info (currently public profile)
 */
export interface IdentitySummary {
    did: string;
    publicProfile?: IssuerPublicProfileSummary;
}
export interface CredentialMetadataSummary extends CredentialMetadata {
    issuer: IdentitySummary;
}
export interface CredentialMetadata {
    type: string;
    renderInfo?: CredentialOfferRenderInfo;
    metadata?: CredentialOfferMetadata;
    credential?: CredentialDefinition;
}
/**
 * @category Transports
 */
export interface TransportDesc {
    type: string;
    config?: any;
}
/**
 * @category Transports
 */
export declare type TransportMessageHandler = (msg: string) => Promise<void>;
/**
 * @category Transports
 */
export interface TransportHandler {
    configure?(...args: any[]): void;
    start(d: TransportDesc, cb?: TransportMessageHandler): TransportAPI;
}
/**
 * @category Transports
 */
export interface TransportAPI {
    desc?: TransportDesc;
    send: (token: string) => Promise<void>;
    stop?: () => void;
    ready?: Promise<void>;
    onMessage?: TransportMessageHandler;
}
/**
 * @category Transports
 */
export declare enum InteractionTransportType {
    QR = "QR",
    Deeplink = "Deeplink",
    HTTP = "HTTP",
    Bluetooth = "Bluetooth",
    NFC = "NFC"
}
/**
 * @category Transports
 */
export declare enum ChannelTransportType {
    WebSockets = "WebSockets"
}
/**
 * @category Transports
 */
export interface ChannelTransportDesc extends TransportDesc {
    type: ChannelTransportType;
}
export interface ObjectKeeper<Type, CreateArgs = any, QueryArgs = CreateArgs, ExportType = CreateArgs> {
    get(id: string): Promise<Type>;
    create?(args: CreateArgs): Promise<Type>;
    query?(query?: QueryArgs, options?: QueryOptions): Promise<Type[]>;
    delete?(query: QueryArgs): Promise<boolean>;
    export?(query?: QueryArgs, options?: QueryOptions): Promise<ExportType[]>;
    import?(data: ExportType[]): Promise<[ExportType, SDKError][]>;
}
/**
 * @category Export/Import
 */
export declare const EXPORT_SCHEMA_VERSION = "1.0.0";
/**
 * @category Export/Import
 */
export interface ExportedAgentData {
    encryptedWallet?: string;
    credentials?: ISignedCredentialAttrs[];
    credentialsMetadata?: CredentialMetadataSummary[];
    interactions?: any[];
    interactionTokens?: string[];
}
/**
 * @category Export/Import
 */
export interface ExportAgentOptions {
    password?: string;
    credentials?: boolean;
    interactions?: boolean;
}
/**
 * @category Export/Import
 */
export declare const DEFAULT_EXPORT_OPTIONS: ExportAgentOptions;
/**
 * @category Export/Import
 */
export interface IExportedAgent {
    version: string;
    did: string;
    timestamp: number;
    data: string;
}
/**
 * @category Delete
 */
export interface DeleteAgentOptions {
    encryptedWallet?: boolean;
    identity?: boolean;
    credentials?: boolean;
    interactions?: boolean;
}
/**
 * @category Delete
 */
export declare const DEFAULT_DELETE_AGENT_OPTIONS: DeleteAgentOptions;
