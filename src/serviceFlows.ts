import {
  JSONWebToken,
  JWTEncodable,
} from 'jolocom-lib/js/interactionTokens/JSONWebToken'
import { CredentialResponse } from 'jolocom-lib/js/interactionTokens/credentialResponse'
import { CredentialOfferResponse } from 'jolocom-lib/js/interactionTokens/credentialOfferResponse'
import { BackendMiddleware } from './backendMiddleware'
import { InteractionType } from 'jolocom-lib/js/interactionTokens/types'
import { CredentialRequest } from 'jolocom-lib/js/interactionTokens/credentialRequest'
import { CredentialOfferRequest } from 'jolocom-lib/js/interactionTokens/credentialOfferRequest'

const isValid = (p: Promise<void>) => p.then(_ => true).catch(_ => false)

export const isCredReq = (
  t: JSONWebToken<JWTEncodable> | undefined,
): t is JSONWebToken<CredentialRequest> =>
  typeof t !== 'undefined' &&
  t.interactionType === InteractionType.CredentialRequest

export const isCredOfferReq = (
  t: JSONWebToken<JWTEncodable> | undefined,
): t is JSONWebToken<CredentialOfferRequest> =>
  typeof t !== 'undefined' &&
  t.interactionType === InteractionType.CredentialOfferRequest

export const consumeCredentialResponse = (bemw: BackendMiddleware) => async (
  token: JSONWebToken<CredentialResponse>,
) => {
  // realistically, all of this should probably happen before the token is
  // added to the history, to avoid polluting valid interaction histories with invalid tokens
  const history = await bemw.storageLib.get.interactionTokens({
    nonce: token.nonce,
  })

  if (history.length != 2) throw new Error('bad interaction')

  const request = history.find(
    t => t.interactionType === InteractionType.CredentialRequest,
  )

  if (!isCredReq(request)) throw new Error('bad interaction')

  return (
    (await isValid(bemw.identityWallet.validateJWT(token, request))) &&
    (await token.interactionToken.satisfiesRequest(request.interactionToken))
  )
}

export const consumeCredentialOfferResponse = (
  bemw: BackendMiddleware,
) => async (token: JSONWebToken<CredentialOfferResponse>) => {
  // realistically, all of this should probably happen before the token is
  // added to the history, to avoid polluting valid interaction histories with invalid tokens
  const history = await bemw.storageLib.get.interactionTokens({
    nonce: token.nonce,
  })

  if (history.length != 3) throw new Error('bad interaction')

  const request = history.find(
    t => t.interactionType === InteractionType.CredentialOfferRequest,
  )

  if (isCredOfferReq(request)) throw new Error('bad interaction')

  return await bemw.identityWallet.validateJWT(token, request)
}
