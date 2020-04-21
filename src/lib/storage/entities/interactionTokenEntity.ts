import { plainToClass } from 'class-transformer'

import { PrimaryGeneratedColumn, Entity, Column } from 'typeorm'
import {
  JWTEncodable,
  JSONWebToken,
} from 'jolocom-lib/js/interactionTokens/JSONWebToken'

@Entity('interaction_tokens')
export class InteractionTokenEntity {
  @PrimaryGeneratedColumn()
  id!: number

  @Column()
  nonce!: string

  @Column()
  type!: string

  @Column()
  issuer!: string

  @Column()
  timestamp!: number

  @Column()
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
