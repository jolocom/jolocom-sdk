export enum CallType {
  AsymEncrypt = 'asymEncrypt',
  AsymDecrypt = 'asymDecrypt',
  Sign = 'sign',
}

export type Call<T> = {
  request: T
  callbackURL: string
}

export type Result<T> = {
  result: T
}

export type DecryptionRequest = Call<string>

export type DecryptionResponse = Result<string>

export type EncryptionRequest = Call<{ target: string; data: string }>

export type EncryptionResponse = Result<string>

export type SigningRequest = Call<string>

export type SigningResponse = Result<string>
