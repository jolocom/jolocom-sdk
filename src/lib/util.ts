import { randomBytes } from 'crypto'
import { claimsMetadata } from 'jolocom-lib'
import {
  uiCategoryByCredentialType,
  Categories,
  uiCredentialTypeByType,
} from './categories'
import { BaseMetadata } from 'cred-types-jolocom-core'

import { DecoratedClaims, IdentitySummary, IssuerPublicProfileSummary } from './types'
import { equals } from 'ramda'
import { Identity } from 'jolocom-lib/js/identity/identity'

/**
 * Given an identity, returns an object satisfying the {@link IdentitySummary} interface.
 * @dev Currently used with the {@link IssuerCard} component
 * @note In case the identity does not contain a Public Profile credential,
 * the function will return a minimal default which can be rendered.
 * @param identity - Instance of identity to generate the summary for
 */

export const generateIdentitySummary = (
  identity: Identity,
): IdentitySummary => {
  const { publicProfile, did } = identity
  if (!publicProfile) {
    return {
      did,
    }
  }
  const { id, ...parsedProfile } = publicProfile.claim
  return {
    did,
    publicProfile: parsedProfile as IssuerPublicProfileSummary,
  }
}

export const getClaimMetadataByCredentialType = (
  type: string,
): BaseMetadata => {
  const uiType = Object.keys(uiCredentialTypeByType).find(
    item => uiCredentialTypeByType[item] === type,
  )
  const relevantType = Object.keys(claimsMetadata).find(
    key => claimsMetadata[key].type[1] === uiType,
  )

  if (!relevantType) {
    throw new Error("Unknown credential type, can't find metadata")
  }

  return claimsMetadata[relevantType]
}

export const getUiCredentialTypeByType = (type: string[]): string =>
  uiCredentialTypeByType[type[1]] || prepareLabel(type[1])

export const getCredentialUiCategory = ({
  credentialType,
}: DecoratedClaims): string => {
  const uiCategories = Object.keys(uiCategoryByCredentialType)

  return (
    uiCategories.find(uiCategory =>
      uiCategoryByCredentialType[uiCategory].some(equals(credentialType)),
    ) || Categories.Other
  )
}

export const prepareLabel = (label: string): string => {
  const words = label.split(/(?=[A-Z0-9])/)
  return words.length > 1 ? words.map(capitalize).join(' ') : capitalize(label)
}

export const capitalize = (word: string): string =>
  `${word[0].toUpperCase()}${word.slice(1)}`

export const compareDates = (date1: Date, date2: Date): number =>
  Math.floor(
    (Date.UTC(date2.getFullYear(), date2.getMonth(), date2.getDate()) -
      Date.UTC(date1.getFullYear(), date1.getMonth(), date1.getDate())) /
      (1000 * 60 * 60 * 24),
  )

export async function generateSecureRandomBytes(
  length: number,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    randomBytes(length, (err, bytes) => {
      if (err) reject(err)
      else resolve(bytes)
    })
  })
}
