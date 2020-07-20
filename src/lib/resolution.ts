type DDO = string

export interface ResolverMetada {
  driverId: string
  driver: string
  retrived: Date
}

export interface MethodMetadata<T = string[]> {
  stateProof: T
}
// writing a guard for this is a huge pain
export interface ResolutionResult {
  '@context': 'https://www.w3.org/ns/did-resolution/v1'
  didDocument: DDO
  resolverMetadata: ResolverMetadata
  methodMetadata: MethodMetadata
}

export const getResolverMetadata = (method: string) => ({
  driverId: method,
  driver: 'Peer',
  retrieved: Date.now(),
})
