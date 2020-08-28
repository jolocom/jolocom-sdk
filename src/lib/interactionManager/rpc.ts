export type RPCRequest<T> = {
  request: T
  callbackURL: string
}

export type RPCResponse<T> = {
  result: T
}

export type DecryptionRequest = RPCRequest<string>
export type DecryptionResponse = RPCResponse<string>
export type EncryptionRequest = RPCRequest<{ target: string; data: string }>
export type EncryptionResponse = RPCResponse<string>
export type SigningRequest = RPCRequest<string>
export type SigningResponse = RPCResponse<string>
