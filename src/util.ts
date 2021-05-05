import { randomBytes } from 'crypto'

import {
  IdentitySummary,
  IssuerPublicProfileSummary,
  DeleteIdentityDataOptions,
  DEFAULT_DELETE_DATA_OPTIONS,
} from './types'
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

/**
 * Simple implementation of jsonpath that only supports very direct addressing
 * This takes a path p and and obj and returns the nested value denoted by the
 * path
 *
 * Example:
 * let obj = { some: { properties: ['a', 'b'] } }
 * jsonpath('$.some.properties.0', obj) === 'a'
 * jsonpath("$['some']['properties'][1]", obj) === 'b'
 * jsonpath("$.some", obj) === obj.some
 *
 * @param p - a path into the object, as in the example
 * @param obj - an object or array
 */
export const jsonpath = function simpleJsonPath(
  p: string,
  obj: object | any[],
): any {
  let trimmedP = p.trim()
  if (trimmedP[0] != '$') return

  let frags: string[]
  if (trimmedP[1] === '.') {
    // remove the beginning '$.' and split on '.'
    frags = trimmedP.substring(2).split('.')
  } else if (trimmedP[1] === '[') {
    // remove the beginning '$' and replace separating '][' with ','
    trimmedP = trimmedP.substring(1).replace('][', ',')
    // result should look like a json list ['some',2]
    frags = JSON.parse(trimmedP)
  } else {
    return
  }

  // go through the object key path and reduce to desired value
  return frags.reduce((obj, k) => {
    if (!obj) return
    if (Array.isArray(obj)) {
      try {
        return obj[parseInt(k)]
      } catch {
        return
      }
    } else if (typeof obj === 'object') {
      return obj[k]
    }
  }, obj)
}

export const getDeleteIdentityDataOptions = (
  options?: DeleteIdentityDataOptions,
): DeleteIdentityDataOptions => ({ ...DEFAULT_DELETE_DATA_OPTIONS, ...options })
