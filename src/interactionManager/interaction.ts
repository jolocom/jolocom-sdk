import {
  InteractionType,
  CredentialOfferResponseSelection,
} from 'jolocom-lib/js/interactionTokens/types'
import { JSONWebToken } from 'jolocom-lib/js/interactionTokens/JSONWebToken'
import {
  InteractionSummary,
  InteractionRole,
  AuthenticationFlowState,
  FlowType,
  EstablishChannelType,
  EstablishChannelRequest,
  CredentialOfferFlowState,
  EncryptionType,
  DecryptionType,
  EncryptionRequest,
  EncryptionResponse,
  DecryptionRequest,
  DecryptionResponse,
  SigningRequest,
  SigningResponse,
  SigningType,
} from './types'
import { Flow } from './flow'
import { CredentialOfferRequest } from 'jolocom-lib/js/interactionTokens/credentialOfferRequest'
import { CredentialRequest } from 'jolocom-lib/js/interactionTokens/credentialRequest'
import { SDKError, ErrorCode } from '../errors'
import { Authentication } from 'jolocom-lib/js/interactionTokens/authentication'
import { Identity } from 'jolocom-lib/js/identity/identity'

import {
  AuthorizationType,
  AuthorizationRequest,
  AuthorizationFlowState,
} from './types'

import {
  InteractionManager,
} from './interactionManager'

import { SignedCredential } from 'jolocom-lib/js/credentials/signedCredential/signedCredential'
import { CredentialOfferResponse } from 'jolocom-lib/js/interactionTokens/credentialOfferResponse'

import { CredentialOfferFlow } from './credentialOfferFlow'
import { CredentialRequestFlow } from './credentialRequestFlow'
import { AuthenticationFlow } from './authenticationFlow'
import { AuthorizationFlow } from './authorizationFlow'
import { EstablishChannelFlow } from './establishChannelFlow'
import { EncryptionFlow } from './encryptionFlow'
import { DecryptionFlow } from './decryptionFlow'
import { SigningFlow } from './signingFlow'
import {
  ResolutionType,
  ResolutionFlow,
  ResolutionFlowState,
  ResolutionRequest,
} from './resolutionFlow'

import { generateIdentitySummary } from '../util'
import { last } from 'ramda'
import { TransportAPI, TransportDesc, InteractionTransportType } from '../types'
import { Transportable } from '../transports'
import { CredentialQuery } from 'src/storage'

export const flows = [
  AuthenticationFlow,
  AuthorizationFlow,
  CredentialOfferFlow,
  CredentialRequestFlow,
  EstablishChannelFlow,
  SigningFlow,
  EncryptionFlow,
  DecryptionFlow,
  ResolutionFlow
]

const interactionFlowForMessage = {}
const interactionFlowForFlowType = {}
flows.forEach(f => {
  interactionFlowForMessage[f.firstMessageType] = f
  interactionFlowForFlowType[f.type] = f
})

/**
 * This class is instantiated by the {@link InteractionManager} when it needs to
 * keep track of an ongoing interaction with another identity. It provides the
 * main API to respond to and get information about an ongoing interaction.
 *
 * Two identities interact by sending each other signed messages wrapped in
 * {@link JSONWebToken}. The messages have to have correct types and
 * follow the sequence expected by one of the predefined {@link Flow}s.
 *
 * {@link Interaction} objects hold a list of tokens exchanged in the
 * interaction, and an instance of the appropriate {@link Flow} class to handle
 * this interaction. Consumers of this object should generally not need to
 * directly interaction with the {@link Flow} instance.
 *
 */
export class Interaction<F extends Flow<any> = Flow<any>> extends Transportable {
  public static getTypes() {
    // @ts-ignore
    return Object.values(interactionFlowForMessage).map(v => v.type)
  }
  public static getRequestTokenType(interxnType: string) {
    return interactionFlowForFlowType[interxnType]?.firstMessageType
  }
  public static getFlowForType(interxnType: string) {
    return interactionFlowForFlowType[interxnType]
  }

  private messages: Array<JSONWebToken<any>> = []

  /**
   * The `id` is currently the {@link JSONWebToken.nonce} of the first token
   */
  public id: string
  public ctx: InteractionManager
  public flow: F

  /**
   * A map of all interaction participants to {@link jolocom-lib/js/identity/identity#Identity} objects. This is
   * incrementally built up as the interaction receives new messages.
   */
  public participants: {
    [k in InteractionRole]?: Identity
  } = {}

  role?: InteractionRole

  /**
   * @param ctx - The manager of this interaction
   * @param transportAPI - reference to an open transport to reach the
   *                       {@link Interaction.participants}
   * @param id - A unique identifier for this interaction
   * @param interactionType - the {@link InteractionType} of this interaction,
   *    which must match one of the known initial flow message types registered
   *    in {@link interactionFlowForMessage}
   */
  public constructor(
    ctx: InteractionManager,
    id: string,
    interactionType: string,
    transportAPI?: TransportAPI
  ) {
    super(transportAPI)

    this.ctx = ctx
    this.id = id
    this.flow = new interactionFlowForMessage[interactionType](this)
  }

  /**
   * Returns an Interaction with state calculated from the given list of
   * messages. The messages are *not* committed to storage or validated in the
   * process, because this method is intended to be used to reload previously
   * stored interactions. See {@link InteractionManager.getInteraction}
   *
   * @param messages - List of messages to calculate interaction state from
   * @param ctx - The manager of this interaction
   * @param id - A unique identifier for this interaction
   * @param transportAPI - reference to an open transport to reach the
   *                       {@link Interaction.participants}
   */
  static async fromMessages<F extends Flow<any>>(
    messages: Array<JSONWebToken<any>>,
    ctx: InteractionManager,
    id: string,
    transportAPI?: TransportAPI
  ): Promise<Interaction<F>> {
    const firstToken = messages[0]
    const interaction = new Interaction<F>(
      ctx,
      firstToken.nonce,
      firstToken.interactionType,
      transportAPI
    )

    // we process all the tokens sequentially, withot revalidating
    for (let message of messages) {
      await interaction._processToken(message)
    }
    return interaction
  }

  get firstMessage() {
    if (this.messages.length < 1) throw new Error('Empty interaction')
    return this.messages[0]
  }

  get lastMessage() {
    if (this.messages.length < 1) throw new Error('Empty interaction')
    return this.messages[this.messages.length - 1]
  }

  public getMessages() {
    return this.messages
  }

  private findMessageByType(type: string) {
    return this.getMessages().find(
      ({ interactionType }) => interactionType === type,
    )
  }

  get counterparty(): Identity | undefined {
    if (!this.role) return
    const counterRole =
      this.role === InteractionRole.Requester
        ? InteractionRole.Responder
        : InteractionRole.Requester
    return this.participants[counterRole]
  }


  // TODO Try to write a respond function that collapses these

  /**
   * @category Auth
   */
  public async createAuthenticationResponse() {
    const request = this.findMessageByType(
      InteractionType.Authentication,
    ) as JSONWebToken<Authentication>
    const { description } = this.getSummary().state as AuthenticationFlowState
    const pca = await this.ctx.ctx.getProofOfControlAuthority().then(pca => ({ pca })).catch(_ => ({}))

    return this.ctx.ctx.identityWallet.create.interactionTokens.response.auth(
      {
        description,
        callbackURL: request.interactionToken.callbackURL,
        ...pca
      },
      await this.ctx.ctx.passwordStore.getPassword(),
      request,
    )
  }

  /**
   * @category Establish Channel
   */
  public async createEstablishChannelResponse(transportIdx: number) {
    const request = this.findMessageByType(
      EstablishChannelType.EstablishChannelRequest,
    ) as JSONWebToken<EstablishChannelRequest>
    const pca = await this.ctx.ctx.getProofOfControlAuthority().then(pca => ({ pca })).catch(_ => ({}))

    return this.ctx.ctx.identityWallet.create.message(
      {
        message: { transportIdx },
        typ: EstablishChannelType.EstablishChannelResponse,
        ...pca
      },
      await this.ctx.ctx.passwordStore.getPassword(),
      request,
    )
  }

  public async createResolutionResponse() {
    const request = this.findMessageByType(
      ResolutionType.ResolutionRequest,
    ) as JSONWebToken<ResolutionRequest>
    const reqMessage = (this.flow.state as ResolutionFlowState).request
    const uriToResolve = (reqMessage && reqMessage.uri) || this.ctx.ctx.idw.did

    const pca = await this.ctx.ctx.getProofOfControlAuthority().then(pca => ({ pca })).catch(_ => ({}))

    const stateId = last(uriToResolve.split(':')) || ''
    const stateProof = await this.ctx.ctx.storage.eventDB
      .read(stateId)
      .catch((_: any) => "")

    return this.ctx.ctx.identityWallet.create.message(
      {
        message: {
          '@context': 'https://www.w3.org/ns/did-resolution/v1',
          didDocument: (
            await this.ctx.ctx.resolve(uriToResolve)
          ).didDocument.toJSON(),
          resolverMetadata: {
            driverId: this.ctx.ctx.identityWallet.did,
            driver: 'jolocom/peer-resolution/0.1',
            retrieved: Date.now(),
          },
          methodMetadata: { stateProof },
        },
        typ: ResolutionType.ResolutionResponse,
        ...pca
      },
      await this.ctx.ctx.passwordStore.getPassword(),
      request,
    )
  }

  /**
   * @category Auth
   */
  public async createAuthorizationResponse() {
    const request = this.findMessageByType(
      AuthorizationType.AuthorizationRequest,
    ) as JSONWebToken<AuthorizationRequest>

    const { description, imageURL, action } = this.getSummary()
      .state as AuthorizationFlowState
    const pca = await this.ctx.ctx.getProofOfControlAuthority().then(pca => ({ pca })).catch(_ => ({}))

    return this.ctx.ctx.identityWallet.create.message(
      {
        message: {
          description,
          ...(imageURL && { imageURL }),
          ...(action && { action }),
        },
        typ: AuthorizationType.AuthorizationResponse,
        ...pca
      },
      await this.ctx.ctx.passwordStore.getPassword(),
      request,
    )
  }

  /**
   * @category Credential Share
   */
  public async createCredentialResponse(selectedCredentials: string[]) {
    const request = this.findMessageByType(
      InteractionType.CredentialRequest,
    ) as JSONWebToken<CredentialRequest>

    const credentials = await Promise.all(
      selectedCredentials.map(
        async id => (await this.getVerifiableCredential({ id }))[0],
      ),
    )
    const pca = await this.ctx.ctx.getProofOfControlAuthority().then(pca => ({ pca })).catch(_ => ({}))

    return this.ctx.ctx.identityWallet.create.interactionTokens.response.share(
      {
        callbackURL: request.interactionToken.callbackURL,
        suppliedCredentials: credentials.map(c => c.toJSON()),
        ...pca
      },
      await this.ctx.ctx.passwordStore.getPassword(),
      request,
    )
  }

  /**
   * @category Credential Offer
   */
  public async createCredentialOfferResponseToken(
    selectedOffering: CredentialOfferResponseSelection[],
  ) {
    const credentialOfferRequest = this.findMessageByType(
      InteractionType.CredentialOfferRequest,
    ) as JSONWebToken<CredentialOfferRequest>
    const pca = await this.ctx.ctx.getProofOfControlAuthority().then(pca => ({ pca })).catch(_ => ({}))

    const credentialOfferResponseAttr = {
      callbackURL: credentialOfferRequest.interactionToken.callbackURL,
      selectedCredentials: selectedOffering,
      ...pca
    }

    return this.ctx.ctx.identityWallet.create.interactionTokens.response.offer(
      credentialOfferResponseAttr,
      await this.ctx.ctx.passwordStore.getPassword(),
      credentialOfferRequest,
    )
  }

  /**
   * @category Credential Offer
   */
  public async issueSelectedCredentials(offerMap?: {
    [k: string]: (
      inp?: any,
    ) => Promise<{ claim: any; metadata?: any; subject?: string }>
  }): Promise<SignedCredential[]> {
    const flowState = this.flow.state as CredentialOfferFlowState
    const password = await this.ctx.ctx.passwordStore.getPassword()
    return Promise.all(
      flowState.selectedTypes.map(async type => {
        const offerTypeHandler = offerMap && offerMap[type]
        const credDesc = offerTypeHandler && (await offerTypeHandler())

        const metadata = (credDesc && credDesc.metadata) || { context: [] }
        const subject = (credDesc && credDesc.subject) || this.counterparty?.did
        if (!subject) throw new Error('no subject for credential')

        return this.ctx.ctx.idw.create.signedCredential(
          {
            metadata,
            claim: credDesc?.claim,
            subject,
          },
          password,
        )
      }),
    )
  }

  /**
   * @category Credential Offer
   */
  public async createCredentialReceiveToken(customCreds?: SignedCredential[]) {
    const creds = customCreds || (await this.issueSelectedCredentials())

    const request = this.findMessageByType(
      InteractionType.CredentialOfferResponse,
    ) as JSONWebToken<CredentialOfferResponse>

    return this.ctx.ctx.identityWallet.create.interactionTokens.response.issue(
      {
        signedCredentials: creds.map(c => c.toJSON()),
      },
      await this.ctx.ctx.passwordStore.getPassword(),
      request,
    )
  }

  private async _processToken<T>(
    token: JSONWebToken<T>,
  ): Promise<boolean> {
    if (!this.participants.requester) {
      // TODO what happens if the signer isnt resolvable
      try {
        const requester = await this.ctx.ctx.resolve(token.signer.did)
        this.participants.requester = requester
        if (requester.did === this.ctx.ctx.identityWallet.did) {
          this.role = InteractionRole.Requester
        }
      } catch (err) {
        console.error('error resolving requester', err)
      }
    } else if (!this.participants.responder) {
      try {
        const responder = await this.ctx.ctx.resolve(token.signer.did)
        this.participants.responder = responder
        if (responder.did === this.ctx.ctx.identityWallet.did) {
          this.role = InteractionRole.Responder
        }
      } catch (err) {
        console.error('error resolving responder', err)
      }
    }

    if (!this._transportAPI) {
      // update transportAPI
      // @ts-ignore
      const { callbackURL } = token.interactionToken

      if (callbackURL) {
        const transportDesc: TransportDesc = {
          type: InteractionTransportType.HTTP,
          config: callbackURL,
        }

        const onMessage = async (msg: string) => {
          // TODO throw on failure? processInteractionToken returns bool
          await this.ctx.ctx.processJWT(msg)
        }
        this.transportAPI =
          await this.ctx.ctx.sdk.transports.start(transportDesc, onMessage)
      }
    }

    // TODO if handling fails, should we still be pushing the token??
    const res = await this.flow.handleInteractionToken(token.interactionToken, token.interactionType)
    this.messages.push(token)

    return res
  }

  /**
   * Validate an interaction token and process it to update the interaction
   * state (via the associated {@link Flow})
   *
   * @param token - the token to validate and process
   * @returns Promise<boolean> whether or not processing was successful
   * @throws SDKError<InvalidToken> with `origError` set to the original token
   *                                validation error from the jolocom library
   * @category Basic
   *
   */
  public async processInteractionToken<T>(
    token: JSONWebToken<T>,
  ): Promise<boolean> {
    // verify
    try {
      await this.ctx.ctx.idw.validateJWT(
        token,
        this.messages.length ? this.messages[this.messages.length - 1] : undefined,
        this.ctx.ctx.resolver
      )
    } catch (err) {
      throw new SDKError(ErrorCode.InvalidToken, err)
    }

    return this._processToken(token)
  }

  /**
   * @category Asymm Crypto
   */
  public async createEncResponseToken(): Promise<
    JSONWebToken<EncryptionResponse>
  > {
    const encRequest = this.findMessageByType(
      EncryptionType.EncryptionRequest,
    ) as JSONWebToken<EncryptionRequest>
    const msg = encRequest.payload.interactionToken!.request

    const data = Buffer.from(
      encRequest.payload.interactionToken!.request.data,
      'base64',
    )

    const targetParts = msg.target.split('#')
    let result
    if (targetParts.length === 2) {
      // it includes a keyRef
      result = await this.ctx.ctx.identityWallet.asymEncryptToDidKey(
        data,
        msg.target,
        this.ctx.ctx.sdk.resolver,
      )
    } else if (targetParts.length === 1) {
      // it does not include a keyRef
      result = await this.ctx.ctx.identityWallet.asymEncryptToDid(
        data,
        msg.target,
        this.ctx.ctx.sdk.resolver,
      )
    } else {
      throw new Error('bad encryption target: ' + msg.target)
    }
    const pca = await this.ctx.ctx.getProofOfControlAuthority().then(pca => ({ pca })).catch(_ => ({}))

    return this.ctx.ctx.identityWallet.create.message(
      {
        message: {
          callbackURL: encRequest.payload.interactionToken!.callbackURL,
          result: result.toString('base64'),
        },
        typ: EncryptionType.EncryptionResponse,
        ...pca
      },
      await this.ctx.ctx.passwordStore.getPassword(),
      encRequest,
    )
  }

  /**
   * @category Asymm Crypto
   */
  public async createDecResponseToken(): Promise<
    JSONWebToken<DecryptionResponse>
  > {
    const decRequest = this.findMessageByType(
      DecryptionType.DecryptionRequest,
    ) as JSONWebToken<DecryptionRequest>

    const password = await this.ctx.ctx.passwordStore.getPassword()
    const pca = await this.ctx.ctx.getProofOfControlAuthority().then(pca => ({ pca })).catch(_ => ({}))

    const data = Buffer.from(
      decRequest.payload.interactionToken!.request.data,
      'base64',
    )
    const result = await this.ctx.ctx.identityWallet.asymDecrypt(data, password)

    return this.ctx.ctx.identityWallet.create.message(
      {
        message: {
          result: result.toString('base64'),
        },
        typ: DecryptionType.DecryptionResponse,
        ...pca
      },
      password,
      decRequest,
    )
  }

  /**
   * @category Asymm Crypto
   */
  public async createSigningResponseToken(): Promise<
    JSONWebToken<SigningResponse>
  > {
    const sigRequest = this.findMessageByType(
      SigningType.SigningRequest,
    ) as JSONWebToken<SigningRequest>
    const pass = await this.ctx.ctx.passwordStore.getPassword()
    const pca = await this.ctx.ctx.getProofOfControlAuthority().then(pca => ({ pca })).catch(_ => ({}))

    return this.ctx.ctx.identityWallet.create.message(
      {
        message: {
          result: (
            await this.ctx.ctx.identityWallet.sign(
              Buffer.from(
                sigRequest.payload.interactionToken!.request.data,
                'base64',
              ),
              pass,
            )
          ).toString('base64'),
        },
        typ: SigningType.SigningResponse,
        ...pca
      },
      pass,
      sigRequest,
    )
  }

  public getSummary(): InteractionSummary {
    return {
      initiator: generateIdentitySummary(this.participants.requester!),
      state: this.flow.getState(),
    }
  }

  public async getStoredCredentialById(id: string) {
    return this.ctx.ctx.storage.get.verifiableCredential({
      id,
    })
  }

  public async getVerifiableCredential(query?: CredentialQuery) {
    return this.ctx.ctx.storage.get.verifiableCredential(query)
  }

  /**
   * @category Basic
   *
   * @dev This will crash with a credential receive because it doesn't contain a callbackURL
   * @todo This should probably come from the transport / channel handler
   * @todo Can this use the HttpAgent exported from instead of fetch? http.ts?
   * @todo The return type is difficult to pin down. If we're making a post, we expect a Response obejct,
   *   which either holds a token that can be parsed, or not (i.e. with credential responses, the answer from
   *   the server only holds the status code right now)
   *   If we're linking, the return value is a promise, as per {@see http://reactnative.dev/docs/linking.html#openurl}
   */

  public async send<T>(token: JSONWebToken<T>) {
    return this.transportAPI.send(token.encode())
  }

  private checkFlow(flow: FlowType) {
    if (this.flow.type !== flow) throw new SDKError(ErrorCode.WrongFlow)
  }

  /**
   * @category Credential Offer
   */
  public async storeSelectedCredentials() {
    this.checkFlow(FlowType.CredentialOffer)
    await this.storeCredentialMetadata()

    const { issued, credentialsValidity } = this.flow
      .state as CredentialOfferFlowState

    if (!issued.length) {
      throw new SDKError(ErrorCode.SaveExternalCredentialFailed)
    }

    return Promise.all(
      issued
        .filter((cred, i) => credentialsValidity[i])
        .map(async cred => {
          await this.ctx.ctx.storage.store.verifiableCredential(cred)
          return cred
        }
        ),
    )
  }

  /**
   * @category Credential Offer
   */
  public async storeCredentialMetadata() {
    this.checkFlow(FlowType.CredentialOffer)
    const flow = <CredentialOfferFlow><unknown>this.flow
    try {
      const metadatas = Object.values(await flow.getOfferedCredentialMetadata())
      return Promise.all(
        metadatas.map(metadata =>
          this.ctx.ctx.credentials.types.create(metadata)
        )
      )
    } catch(err) {
      console.error("storeCredentialMetadata failed", err)
      throw new SDKError(ErrorCode.SaveCredentialMetadataFailed, err)
    }
  }
}
