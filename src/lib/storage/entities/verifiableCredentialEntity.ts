import { Exclude, Expose, plainToClass, classToPlain } from 'class-transformer'
import { SignedCredential } from 'jolocom-lib/js/credentials/signedCredential/signedCredential'
import { ISignedCredentialAttrs } from 'jolocom-lib/js/credentials/signedCredential/types'
import { IClaimSection } from 'jolocom-lib/js/credentials/credential/types'
import { PersonaEntity } from './personaEntity'
import { SignatureEntity } from './signatureEntity'
import { CredentialEntity } from './credentialEntity'

@Exclude()
export class VerifiableCredentialEntity {
  // note: avoiding "@context" class property name because it chokes up
  // @babel/plugin-proposal-decorators
  @Expose({ name: '@context' })
  _context!: any

  @Expose()
  id!: string

  @Expose()
  type!: string

  @Expose()
  name!: string

  @Expose()
  issuer!: string

  @Expose()
  issued!: Date

  @Expose()
  expires!: Date

  @Expose()
  subject!: PersonaEntity

  proof!: SignatureEntity[]

  claim!: CredentialEntity[]

  static fromJSON(json: ISignedCredentialAttrs): VerifiableCredentialEntity {
    return plainToClass(VerifiableCredentialEntity, json)
  }

  // TODO typo
  static fromVerifiableCredential(
    vCred: SignedCredential,
  ): VerifiableCredentialEntity {
    interface ExtendedInterface extends ISignedCredentialAttrs {
      subject: string
    }

    const json = vCred.toJSON() as ExtendedInterface
    json.subject = vCred.subject

    return this.fromJSON(json)
  }

  // TODO handle decryption
  toVerifiableCredential(): SignedCredential {
    const json = classToPlain(this) as any
    const entityData = {
      ...json,
      claim: convertClaimArrayToObject(this.claim, this.subject.did),
      proof: this.proof[0],
    }

    return SignedCredential.fromJSON(entityData)
  }
}

const convertClaimArrayToObject = (
  claims: CredentialEntity[],
  did: string,
): IClaimSection =>
  claims.reduce(
    (acc: IClaimSection, claim: CredentialEntity) => {
      const { propertyName, propertyValue } = claim
      return { ...acc, [propertyName]: propertyValue }
    },
    { id: did },
  )
