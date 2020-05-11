import { plainToClass } from 'class-transformer'

import {
  JWTEncodable,
  JSONWebToken,
} from 'jolocom-lib/js/interactionTokens/JSONWebToken'

export class InteractionTokenEntity {
  id!: number
  nonce!: string
  type!: string
  issuer!: string
  timestamp!: number
  original!: string

  static fromJWT(jwt: JSONWebToken<JWTEncodable>): InteractionTokenEntity {
    return plainToClass(InteractionTokenEntity, {
      nonce: jwt.nonce,
      type: jwt.interactionType,
      issuer: jwt.issuer,
      timestamp: jwt.issued,
      original: jwt.encode(),
    })
  }
}
