export enum CallType {
  AsymEncrypt = 'asymEncrypt',
  AsymDecrypt = 'asymDecrypt',
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
