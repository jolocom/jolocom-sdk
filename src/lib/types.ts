import {
  CredentialOfferMetadata,
  CredentialOfferRenderInfo,
} from 'jolocom-lib/js/interactionTokens/interactionTokens.types'

import { PublicProfileClaimMetadata } from 'cred-types-jolocom-core/types'

/**
 * @dev Simply using all claims required by the public profile
 */

export type IssuerPublicProfileSummary = PublicProfileClaimMetadata['claimInterface']

/**
 * @dev An identity summary is composed of a DID + all public info (currently public profile)
 */

export interface IdentitySummary {
  did: string
  publicProfile?: IssuerPublicProfileSummary
}

export interface PaymentRequestSummary {
  callbackURL: string
  requester: IdentitySummary
  receiver: {
    did: string
    address: string
  }
  requestJWT: string
  amount: number
  description: string
}

export interface DecoratedClaims {
  credentialType: string
  claimData: {
    [key: string]: any /** @TODO Type correctly */
  }
  id: string
  issuer: IdentitySummary
  subject: string
  expires?: Date
  renderInfo?: CredentialOfferRenderInfo
  metadata?: CredentialOfferMetadata
  keyboardType?:
    | 'default'
    | 'number-pad'
    | 'decimal-pad'
    | 'numeric'
    | 'email-address'
    | 'phone-pad'
}

export interface CategorizedClaims {
  readonly [key: string]: DecoratedClaims[]
}
