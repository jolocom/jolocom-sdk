type RequestMessage<T> = {
  request: T
  callbackURL: string
}

type ResponseMessage<T> = {
  result: T
}

type Base64String = string
type DidDocKeyId = string

export type DecryptionRequest = RequestMessage<{ target: DidDocKeyId, data: Base64String }>
export type DecryptionResponse = ResponseMessage<Base64String>
export type EncryptionRequest = RequestMessage<{ target: DidDocKeyId; data: Base64String }>
export type EncryptionResponse = ResponseMessage<Base64String>
export type SigningRequest = RequestMessage<{ target: DidDocKeyId; data: Base64String }>
export type SigningResponse = ResponseMessage<Base64String>
