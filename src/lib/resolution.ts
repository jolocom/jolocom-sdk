import { IDidDocumentAttrs } from 'jolocom-lib/js/identity/didDocument/types'

export interface ResolverMetadata {
  driverId: string
  driver: string
  retrieved: number
}

export interface MethodMetadata<T = string[]> {
  stateProof: T
}
// writing a guard for this is a huge pain
export interface ResolutionResult {
  '@context': 'https://www.w3.org/ns/did-resolution/v1'
  didDocument: IDidDocumentAttrs
  resolverMetadata: ResolverMetadata
  methodMetadata: MethodMetadata
}

export const getResolverMetadata = (method: string) => ({
  driverId: method,
  driver: 'Peer',
  retrieved: Date.now(),
})
