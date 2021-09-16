import { CredentialRequest } from 'jolocom-lib/js/interactionTokens/credentialRequest';
import { CredentialResponse } from 'jolocom-lib/js/interactionTokens/credentialResponse';
import { Authentication } from 'jolocom-lib/js/interactionTokens/authentication';
import { CredentialOfferRequest } from 'jolocom-lib/js/interactionTokens/credentialOfferRequest';
import { CredentialOfferResponse } from 'jolocom-lib/js/interactionTokens/credentialOfferResponse';
import { CredentialsReceive } from 'jolocom-lib/js/interactionTokens/credentialsReceive';
import { AuthorizationRequest, AuthorizationResponse, AuthorizationType, EstablishChannelResponse, EstablishChannelRequest, EstablishChannelType, EncryptionType, DecryptionType, SigningType } from './types';
export declare const isCredentialRequest: (token: any) => token is CredentialRequest;
export declare const isCredentialResponse: (token: any) => token is CredentialResponse;
export declare const isAuthenticationRequest: (token: any) => token is Authentication;
export declare const isCredentialOfferRequest: (token: any) => token is CredentialOfferRequest;
export declare const isCredentialOfferResponse: (token: any) => token is CredentialOfferResponse;
export declare const isCredentialReceive: (token: any) => token is CredentialsReceive;
export declare const isAuthorizationRequest: (token: any, type: AuthorizationType) => token is AuthorizationRequest;
export declare const isAuthorizationResponse: (token: any, type: AuthorizationType) => token is AuthorizationResponse;
export declare const isEstablishChannelRequest: (token: any, type: EstablishChannelType) => token is EstablishChannelRequest;
export declare const isEstablishChannelResponse: (token: any, type: EstablishChannelType) => token is EstablishChannelResponse;
export declare const isEncryptionRequest: (token: any, type: EncryptionType) => token is {
    request: {
        target: string;
        data: string;
    };
    callbackURL: string;
};
export declare const isEncryptionResponse: (token: any, type: EncryptionType) => token is {
    result: string;
};
export declare const isDecryptionRequest: (token: any, type: DecryptionType) => token is {
    request: {
        target?: string | undefined;
        data: string;
    };
    callbackURL: string;
};
export declare const isDecryptionResponse: (token: any, type: DecryptionType) => token is {
    result: string;
};
export declare const isSigningRequest: (token: any, type: SigningType) => token is {
    request: {
        target?: string | undefined;
        data: string;
    };
    callbackURL: string;
};
export declare const isSigningResponse: (token: any, type: SigningType) => token is {
    result: string;
};
