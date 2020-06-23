export enum CallType {
  AsymEncrypt = 'asymEncrypt',
  AsymDecrypt = 'asymDecrypt',
  Sign = 'sign',
}

export type RPC = {
  rpc: CallType
}

export type Call<T> = RPC & {
  request: T
  callbackURL: string
}

export type Result<T> = RPC & {
  result: T
}

export type DecryptionRequest = Call<string> & {
  rpc: CallType.AsymDecrypt
}

export type DecryptionResponse = Result<string> & {
  rpc: CallType.AsymDecrypt
}

export type EncryptionRequest = Call<{ target: string; data: string }> & {
  rpc: CallType.AsymEncrypt
}

export type EncryptionResponse = Result<string> & {
  rpc: CallType.AsymEncrypt
}

export type SigningRequest = Call<string> & {
  rpc: CallType.Sign
}

export type SigningResponse = Result<string> & {
  rpc: CallType.Sign
}
