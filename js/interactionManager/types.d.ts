import { CredentialOffer, CredentialOfferResponseSelection } from '@jolocom/protocol-ts';
import { SignedCredential } from 'jolocom-lib/js/credentials/signedCredential/signedCredential';
import { CredentialRequest } from 'jolocom-lib/js/interactionTokens/credentialRequest';
import { CredentialResponse } from 'jolocom-lib/js/interactionTokens/credentialResponse';
import { IdentitySummary, ChannelTransportDesc } from '../types';
import { FlowState } from './flow';
export declare enum InteractionRole {
    Requester = "requester",
    Responder = "responder"
}
export interface InteractionSummary {
    initiator: IdentitySummary;
    state: FlowState;
}
export declare enum FlowType {
    Authentication = "Authentication",
    CredentialShare = "CredentialShare",
    CredentialOffer = "CredentialOffer",
    Authorization = "Authorization",
    EstablishChannel = "EstablishChannel",
    Encrypt = "Encrypt",
    Decrypt = "Decrypt",
    Resolution = "Resolution",
    Sign = "Sign"
}
export declare enum EstablishChannelType {
    EstablishChannelRequest = "EstablishChannelRequest",
    EstablishChannelResponse = "EstablishChannelResponse"
}
export interface EstablishChannelRequest {
    description: string;
    transports: ChannelTransportDesc[];
}
export interface EstablishChannelResponse {
    transportIdx: number;
}
export interface EstablishChannelFlowState {
    description: string;
    established: boolean;
    transports?: ChannelTransportDesc[];
    transport?: ChannelTransportDesc;
}
export declare enum AuthorizationType {
    AuthorizationRequest = "AuthorizationRequest",
    AuthorizationResponse = "AuthorizationResponse"
}
export declare enum EncryptionType {
    EncryptionRequest = "EncryptionRequest",
    EncryptionResponse = "EncryptionResponse"
}
export declare enum DecryptionType {
    DecryptionRequest = "DecryptionRequest",
    DecryptionResponse = "DecryptionResponse"
}
export declare enum SigningType {
    SigningRequest = "SigningRequest",
    SigningResponse = "SigningResponse"
}
export interface AuthorizationResponse {
    description: string;
    imageURL?: string;
    action?: string;
}
export interface AuthorizationRequest extends AuthorizationResponse {
    callbackURL: string;
}
export interface AuthorizationFlowState {
    description: string;
    imageURL?: string;
    action?: string;
}
export interface AuthenticationFlowState extends FlowState {
    description: string;
}
export interface CredentialRequestFlowState extends FlowState {
    constraints: CredentialRequest[];
    providedCredentials: CredentialResponse[];
}
export interface CredentialOfferFlowState extends FlowState {
    offerSummary: CredentialOffer[];
    selection: CredentialOfferResponseSelection[];
    selectedTypes: string[];
    issued: SignedCredential[];
    credentialsValidity: boolean[];
    credentialsAllValid: boolean;
}
export interface CredentialTypeSummary {
    type: string;
    values: string[];
    verifications: CredentialVerificationSummary[];
}
export interface CredentialVerificationSummary {
    id: string;
    issuer: IdentitySummary;
    selfSigned: boolean;
    expires: string | undefined | Date;
}
export interface AttributeSummary {
    type: string[];
    results: Array<{
        verification: string;
        fieldName: string;
        values: string[];
    }>;
}
export declare type IssuanceResult = Array<SignedCredentialWithMetadata & {
    validationErrors: ValidationErrorMap;
}>;
declare type ValidationErrorMap = {
    invalidIssuer?: boolean;
    invalidSubject?: boolean;
};
export interface SignedCredentialWithMetadata extends CredentialOffer {
    signedCredential?: SignedCredential;
}
declare type RequestMessage<T> = {
    request: T;
    callbackURL: string;
};
declare type ResponseMessage<T> = {
    result: T;
};
declare type Base64String = string;
declare type DidDocKeyId = string;
export declare type DecryptionRequest = RequestMessage<{
    target?: DidDocKeyId;
    data: Base64String;
}>;
export declare type DecryptionResponse = ResponseMessage<Base64String>;
export declare type EncryptionRequest = RequestMessage<{
    target: DidDocKeyId;
    data: Base64String;
}>;
export declare type EncryptionResponse = ResponseMessage<Base64String>;
export declare type SigningRequest = RequestMessage<{
    target?: DidDocKeyId;
    data: Base64String;
}>;
export declare type SigningResponse = ResponseMessage<Base64String>;
export {};
