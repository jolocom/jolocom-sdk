import { Authentication } from 'jolocom-lib/js/interactionTokens/authentication'

export enum CallType {
  AsymEncrypt = 'asymEncrypt',
}

type Call<T> = {
  rpc: CallType
  request: T
}

type Result<T> = {
  rpc: CallType
  response: T
}

export type AsymEncryptCall = Call<string> & {
  rpc: CallType.AsymEncrypt
}

export type AsymEncryptResult = Result<string> & {
  rpc: CallType.AsymEncrypt
}

// says "RPC" but really right now it's just encryption req/res
export class RPCRequest extends Authentication {
  // _request: AsymEncryptCall

  set description(description: string) {}

  set request(request: AsymEncryptCall) {
    this.description = JSON.stringify(request)
  }

  get request(): AsymEncryptRequest {
    return JSON.parse(super.description) as AsymEncryptRequest
  }
}

export class RPCResponse extends Authentication {
  // _response: AsymEncryptResult

  set description(description: string) {}

  set response(response: AsymEncryptResult) {
    this.description = JSON.stringify(response)
  }

  get response(): AsymEncryptResult {
    return JSON.parse(super.description) as AsymEncryptResult
  }
}
