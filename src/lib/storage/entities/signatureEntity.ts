import { VerifiableCredentialEntity } from './verifiableCredentialEntity'
import { plainToClass } from 'class-transformer'
import {
  ILinkedDataSignature,
  ILinkedDataSignatureAttrs,
} from 'jolocom-lib/js/linkedDataSignature/types'

export class SignatureEntity {
  id!: number
  verifiableCredential!: VerifiableCredentialEntity
  type!: string
  created!: Date
  creator!: string
  nonce!: string
  signatureValue!: string

  static fromJSON(json: ILinkedDataSignatureAttrs): SignatureEntity {
    return plainToClass(SignatureEntity, json)
  }

  static fromLinkedDataSignature(lds: ILinkedDataSignature) {
    const json = lds.toJSON() as ILinkedDataSignatureAttrs
    return this.fromJSON(json)
  }
}
