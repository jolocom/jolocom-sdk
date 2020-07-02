import { CredentialOfferFlow } from './credentialOfferFlow'
import { InteractionType } from 'jolocom-lib/js/interactionTokens/types'
import { JSONWebToken } from 'jolocom-lib/js/interactionTokens/JSONWebToken'
import { BackendMiddleware } from '../../backendMiddleware'
import {
  InteractionChannel,
  InteractionSummary,
  SignedCredentialWithMetadata,
  CredentialVerificationSummary,
  AuthenticationFlowState,
} from './types'
import { CredentialRequestFlow } from './credentialRequestFlow'
import { JolocomLib } from 'jolocom-lib'
import { CredentialMetadataSummary } from '../storage'
import { Flow } from './flow'
import { last } from 'ramda'
import { CredentialOfferRequest } from 'jolocom-lib/js/interactionTokens/credentialOfferRequest'
import { AuthenticationFlow } from './authenticationFlow'
import { CredentialRequest } from 'jolocom-lib/js/interactionTokens/credentialRequest'
import { Linking } from '../../polyfills/reactNative'
import { AppError, ErrorCode } from '../errors'
import { Authentication } from 'jolocom-lib/js/interactionTokens/authentication'
import { Identity } from 'jolocom-lib/js/identity/identity'
import { httpAgent } from '../http'

import { generateIdentitySummary } from '../../utils/generateIdentitySummary'

// @ts-ignore
let WebSocket = global.WebSocket || require('ws')

/***
 * - initiated by InteractionManager when an interaction starts
 * - handles the communication channel of the interaction
 * - holds the instance of the particular interaction (e.g. CredentialOffer, Authentication)
 */

/**
 * TODO this map should be constructed from all known flows at runtime
 * Each flow should define its `startMessage`
 */
const interactionFlowForMessage = {
  [InteractionType.CredentialOfferRequest]: CredentialOfferFlow,
  [InteractionType.CredentialRequest]: CredentialRequestFlow,
  [InteractionType.Authentication]: AuthenticationFlow,
}

export class Interaction {
  /**
   * A list of tokens, beginning with a request and alternating between
   * ResponseToken and RequestToken otherwise
   */
  private interactionMessages: JSONWebToken<any>[] = []

  public id: string
  public ctx: BackendMiddleware
  public flow: Flow<any, any>

  // The channel through which the request (first token) came in
  public channel: InteractionChannel

  public participants!: {
    requester: Identity
    responder?: Identity
  }

  public constructor(
    ctx: BackendMiddleware,
    channel: InteractionChannel,
    id: string,
    interactionType: string,
  ) {
    this.ctx = ctx
    this.channel = channel
    this.id = id

    this.flow = new interactionFlowForMessage[interactionType](this)
  }

  public static async start<T>(
    ctx: BackendMiddleware,
    channel: InteractionChannel,
    token: JSONWebToken<T>,
  ): Promise<Interaction> {
    const interaction = new Interaction(
      ctx,
      channel,
      token.nonce,
      token.interactionType,
    )

    await interaction.processInteractionToken(token)

    return interaction
  }

  public getMessages() {
    return this.interactionMessages
  }

  public getMessage(idx = 0) {
    const msg = this.interactionMessages[idx]
    if (typeof msg === 'undefined') {
      throw new Error('no message at index ' + idx)
    }
    return msg
  }

  /**
   * Get the `n`th request message
   *
   * @param n number
   * @returns the message at index 2n, which should be a response message
   */
  public getRequest(n = 0): JSONWebToken<any> {
    const idx = 2*n
    return this.getMessage(idx)
  }

  /**
   * Get the `n`th response message
   *
   * @param n number
   * @returns the message at index 2n+1, which should be a response message
   */
  public getResponse(n = 0): JSONWebToken<any> {
    const idx = 2*n+1
    return this.getMessage(idx)
  }

  /**
   * Get or create the `n`th response message
   *
   * @param n number
   * @returns the message at index 2n+1, which should be a response message
   */
  public async getOrCreateResponse(n = 0): Promise<JSONWebToken<any>> {
    try {
      return this.getResponse(n)
    } catch {
      return this.createResponse(n)
    }
  }

  public async createResponse(n = 0): Promise<JSONWebToken<any>> {
    const idx = 2*n+1
    // TODO error codes
    if (this.interactionMessages[idx]) throw new Error(idx + 'th response message already exists')

    const resp = this.interactionMessages[idx] = await this.flow.createResponseMessage(n)
    return resp
  }

  /**
   * Respond to the nth request. Will create the response and send it.
   *
   */
  public async respond(n = 0): Promise<JSONWebToken<any>> {
    debugger
    const req = this.getRequest(n)
    const resp = await this.getOrCreateResponse(n)
    console.log('Responding to', req, '\nResponding with', resp)
    return this.send(resp, req).then(() => resp)
  }

  private findMessageByType(type: InteractionType) {
    return this.getMessages().find(
      ({ interactionType }) => interactionType === type
    )
  }

  public async createResponseMessage<T, R>(
    args: { message: T; typ: string; expires?: Date; aud?: string },
    recieved?: JSONWebToken<R>,
  ) {
    const pass = await this.ctx.keyChainLib.getPassword()
    return this.ctx.identityWallet.create.message<T, R>(args, pass, recieved)
  }

  // TODO Try to write a respond function that collapses these
  public async createAuthenticationResponse() {
    const request = this.findMessageByType(
      InteractionType.Authentication,
    ) as JSONWebToken<Authentication>
    const { description } = this.getSummary().state as AuthenticationFlowState

    return this.ctx.identityWallet.create.interactionTokens.response.auth(
      {
        description,
        callbackURL: request.interactionToken.callbackURL,
      },
      await this.ctx.keyChainLib.getPassword(),
      request,
    )
  }

  public async createCredentialResponse(
    selectedCredentials: CredentialVerificationSummary[],
  ) {
    const request = this.findMessageByType(
      InteractionType.CredentialRequest,
    ) as JSONWebToken<CredentialRequest>

    const credentials = await Promise.all(
      selectedCredentials.map(
        async ({ id }) => (await this.getVerifiableCredential({ id }))[0],
      ),
    )

    return this.ctx.identityWallet.create.interactionTokens.response.share(
      {
        callbackURL: request.interactionToken.callbackURL,
        suppliedCredentials: credentials.map(c => c.toJSON()),
      },
      await this.ctx.keyChainLib.getPassword(),
      request,
    )
  }

  public async createCredentialOfferResponseToken(
    selectedOffering: SignedCredentialWithMetadata[],
  ) {
    const credentialOfferRequest = this.findMessageByType(
      InteractionType.CredentialOfferRequest,
    ) as JSONWebToken<CredentialOfferRequest>

    const credentialOfferResponseAttr = {
      callbackURL: credentialOfferRequest.interactionToken.callbackURL,
      selectedCredentials: selectedOffering.map(offer => ({
        type: offer.type,
      })),
    }

    return this.ctx.identityWallet.create.interactionTokens.response.offer(
      credentialOfferResponseAttr,
      await this.ctx.keyChainLib.getPassword(),
      credentialOfferRequest,
    )
  }

  /**
   * Validate an interaction token and process it to update the interaction
   * state (via the associated InteractionFlow)
   *
   * @param token JSONWebToken the token to
   * @returns Promise<boolean> whether or not processing was successful
   * @throws AppError<InvalidToken> with `origError` set to the original token
   *                                validation error from the jolocom library
   */
  public async processInteractionToken<T>(token: JSONWebToken<T>): Promise<boolean> {
    if (!this.participants) {
      // TODO what happens if the signer isnt resolvable
      const requester = await this.ctx.registry.resolve(token.signer.did)
      this.participants = {
        requester,
      }
      if (requester.did !== this.ctx.identityWallet.did) {
        this.participants.responder = this.ctx.identityWallet.identity
      }
    } else if (!this.participants.responder) {
      this.participants.responder = await this.ctx.registry.resolve(
        token.signer.did,
      )
    }

    if (token.signer.did !== this.ctx.identityWallet.did) {
      try {
        await this.ctx.identityWallet.validateJWT(
          token,
          last(this.getMessages()),
          this.ctx.registry,
        )
      } catch (err) {
        throw new AppError(ErrorCode.InvalidToken, err)
      }
    }

    return this.flow
      .handleInteractionToken(token.interactionToken, token.interactionType)
      .then(res => {
        this.interactionMessages.push(token)
        // this.ctx.storageLib.store.interactionToken(token)
        return res
      })
  }

  public getSummary(): InteractionSummary {
    return {
      initiator: generateIdentitySummary(this.participants.requester),
      state: this.flow.getState(),
    }
  }

  public getAttributesByType = (type: string[]) => {
    return this.ctx.storageLib.get.attributesByType(type)
  }

  public async getStoredCredentialById(id: string) {
    return this.ctx.storageLib.get.verifiableCredential({
      id,
    })
  }

  public getVerifiableCredential = (query?: object) => {
    return this.ctx.storageLib.get.verifiableCredential(query)
  }

  /**
   * @dev This will crash with a credential receive because it doesn't contain a callbackURL
   * @todo This should probably come from the transport / channel handler
   * @todo Can this use the HttpAgent exported from instead of fetch? http.ts?
   * @todo The return type is difficult to pin down. If we're making a post, we expect a Response obejct,
   *   which either holds a token that can be parsed, or not (i.e. with credential responses, the answer from
   *   the server only holds the status code right now)
   *   If we're linking, the return value is a promise, as per {@see http://reactnative.dev/docs/linking.html#openurl}
   */
  public async send<T, R>(respToken: JSONWebToken<T>, _reqToken?: JSONWebToken<R>) {
    // @ts-ignore - CredentialReceive has no callbackURL, needs fix on the lib for JWTEncodable.
    const { respCallbackURL } = respToken.interactionToken
    let reqToken = _reqToken || this.getRequest()
    // @ts-ignore
    const reqCallbackURL = reqToken ? reqToken.interactionToken.callbackURL : null
    const callbackURL = respCallbackURL || reqCallbackURL

    switch (this.channel) {
      case InteractionChannel.HTTP:
        let response: string
        try {
          response = await httpAgent.postRequest<string>(callbackURL,
            { 'Content-Type': 'application/json' },
            JSON.stringify({ token: respToken.encode() })
          )
        } catch (err) {
          console.error('HTTP Post to ' + callbackURL + ' failed', err)
          // TODO Error code for failed send?
          // TODO Actually include some info about the error
          throw new AppError(ErrorCode.Unknown, err)
        }

        if (response.length) {
          const { token } = JSON.parse(response)
          return JolocomLib.parse.interactionToken.fromJWT(token)
        }
        break

      case InteractionChannel.Deeplink:
        const callback = `${callbackURL}/${respToken.encode()}`
        if (!(await Linking.canOpenURL(callback))) {
          throw new AppError(ErrorCode.DeepLinkUrlNotFound)
        }

        return Linking.openURL(callback).then(() => {})

      case InteractionChannel.WebSocket:
        // TODO
        // look for already pre-established channel to this did?
        // reuse old channel to transport the new token?
        //
        // or else establish new channel
        // send response token
        // keep channel alive and reply process other tokens through the system
        //
        // TODO IMPORTANT TODO
        // But better keep this out of transport layer!
        // This is implicitly establishing a long lived channel as a side effect
        // to some other thing (currently an Authentication flow)
        //
        // probably need to create a new flow, EstablishRPCChannel
        // { requestedCalls: { rpcDecRequest: 'Needed to decrypt invoices' } }
        // and going through that flow successfully will establish a thing in
        // the background
        //
        return new Promise((resolve, reject) => {
          const ws = new WebSocket(callbackURL)

          let ready = false
          // TODO check for open errors and reject the promise
          ws.on('open', () => {
            console.log('Websocket opened to', callbackURL)
            console.log('Sending response', respToken)
            // FIXME don't JSON.stringify
            ws.send(JSON.stringify(respToken.encode()))
          });

          ws.on('close', () => {
            // TODO check for close errors and reject the promise
            resolve()
          })

          ws.on('message', async (message: string) => {
            if (!ready) {
              ready = true
              console.log('READY!')
              //ws.send(JSON.stringify({}))
              return
            }
            console.log('received message:', message)
            if (!message.trim()) {
              console.log('no payload')
              return
            }

            const interaction = await this.ctx.ctx.processJWT(message)
            const resp = await interaction.getOrCreateResponse()
            // TODO no strigify
            ws.send(JSON.stringify(resp.encode()))
          })

        })
        break

      default:
        throw new AppError(ErrorCode.TransportNotSupported)
    }
  }

  /**
   * FIXME
   * The following methods do not make any use of the Interaction object
   * They also access the ctx to far, perhaps need to be lifted up
   * They seem to be more suitable for just remaining on storage
   * where are they used?
   */
  public async storeCredential(toSave: SignedCredentialWithMetadata[]) {
    return Promise.all(
      toSave.map(
        ({ signedCredential }) =>
          signedCredential &&
          this.ctx.storageLib.store.verifiableCredential(signedCredential),
      ),
    )
  }

  public storeCredentialMetadata = (metadata: CredentialMetadataSummary) =>
    this.ctx.storageLib.store.credentialMetadata(metadata)

  public storeIssuerProfile = () =>
    this.ctx.storageLib.store.issuerProfile(
      generateIdentitySummary(this.participants.requester),
    )
}
