import { IDidDocumentAttrs } from 'jolocom-lib/js/identity/didDocument/types';
export interface ResolverMetadata {
    driverId: string;
    driver: string;
    retrieved: number;
}
export interface MethodMetadata<T = string> {
    stateProof: T;
}
export interface ResolutionResult {
    '@context': 'https://www.w3.org/ns/did-resolution/v1';
    didDocument: IDidDocumentAttrs;
    resolverMetadata: ResolverMetadata;
    methodMetadata: MethodMetadata;
}
export declare const getResolverMetadata: (method: string) => {
    driverId: string;
    driver: string;
    retrieved: number;
};
