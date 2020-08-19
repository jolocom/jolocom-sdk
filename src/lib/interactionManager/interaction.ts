import { CredentialOfferFlow } from './credentialOfferFlow'
import { InteractionType } from 'jolocom-lib/js/interactionTokens/types'
import { JSONWebToken } from 'jolocom-lib/js/interactionTokens/JSONWebToken'
import {
  InteractionSummary,
  InteractionRole,
  SignedCredentialWithMetadata,
  AuthenticationFlowState,
  FlowType,
  EstablishChannelType,
  EstablishChannelRequest,
  CredentialOfferFlowState,
  CredentialVerificationSummary,
  EncryptionType,
  DecryptionType,
} from './types'
import { CredentialRequestFlow } from './credentialRequestFlow'
import { Flow } from './flow'
import { CredentialOfferRequest } from 'jolocom-lib/js/interactionTokens/credentialOfferRequest'
import { AuthenticationFlow } from './authenticationFlow'
import { CredentialRequest } from 'jolocom-lib/js/interactionTokens/credentialRequest'
import { AppError, ErrorCode } from '../errors'
import { Authentication } from 'jolocom-lib/js/interactionTokens/authentication'
import { Identity } from 'jolocom-lib/js/identity/identity'

import {
  AuthorizationType,
  AuthorizationRequest,
  AuthorizationFlowState,
} from './types'
import { AuthorizationFlow } from './authorizationFlow'
import { EstablishChannelFlow } from './establishChannelFlow'

import {
  InteractionManager,
  InteractionTransportAPI,
} from './interactionManager'

import { SignedCredential } from 'jolocom-lib/js/credentials/signedCredential/signedCredential'
import { CredentialOfferResponse } from 'jolocom-lib/js/interactionTokens/credentialOfferResponse'

import { EncryptionFlow } from './encryptionFlow'
import { DecryptionFlow } from './decryptionFlow'
import { generateIdentitySummary } from '../../utils/generateIdentitySummary'
import {
  EncryptionRequest,
  EncryptionResponse,
  DecryptionRequest,
  DecryptionResponse,
} from './rpc'

import {
  ResolutionType,
  ResolutionFlow,
  ResolutionFlowState,
  ResolutionRequest,
} from './resolutionFlow'

/***
 * - initiated by InteractionManager when an interaction starts
 * - handles the communication channel of the interaction
 * - holds the instance of the particular interaction (e.g. CredentialOffer, Authentication)
 */

const interactionFlowForMessage = {
  [InteractionType.CredentialOfferRequest]: CredentialOfferFlow,
  [InteractionType.CredentialRequest]: CredentialRequestFlow,
  [InteractionType.Authentication]: AuthenticationFlow,
  [AuthorizationType.AuthorizationRequest]: AuthorizationFlow,
  [EstablishChannelType.EstablishChannelRequest]: EstablishChannelFlow,
  [EncryptionType.EncryptionRequest]: EncryptionFlow,
  [DecryptionType.DecryptionRequest]: DecryptionFlow,
  [ResolutionType.ResolutionRequest]: ResolutionFlow,
}

export class Interaction {
  private interactionMessages: JSONWebToken<any>[] = []
  public id: string
  public ctx: InteractionManager
  public flow: Flow<any>

  public transportAPI: InteractionTransportAPI

  public participants: {
    [k in InteractionRole]?: Identity
  } = {}

  role?: InteractionRole

  public constructor(
    ctx: InteractionManager,
    transportAPI: InteractionTransportAPI,
    id: string,
    interactionType: string,
  ) {
    this.ctx = ctx
    this.transportAPI = transportAPI
    this.id = id
    this.flow = new interactionFlowForMessage[interactionType](this)
  }

  get counterparty(): Identity | undefined {
    if (!this.role) return
    const counterRole =
      this.role === InteractionRole.Requester
        ? InteractionRole.Responder
        : InteractionRole.Requester
    return this.participants[counterRole]
  }

  public getMessages() {
    return this.interactionMessages
  }

  private findMessageByType(type: string) {
    return this.getMessages().find(
      ({ interactionType }) => interactionType === type,
    )
  }

  // TODO Try to write a respond function that collapses these
  public async createAuthenticationResponse() {
    const request = this.findMessageByType(
      InteractionType.Authentication,
    ) as JSONWebToken<Authentication>
    const { description } = this.getSummary().state as AuthenticationFlowState

    return this.ctx.ctx.identityWallet.create.interactionTokens.response.auth(
      {
        description,
        callbackURL: request.interactionToken.callbackURL,
      },
      await this.ctx.ctx.keyChainLib.getPassword(),
      request,
    )
  }

  public async createEstablishChannelResponse(transportIdx: number) {
    const request = this.findMessageByType(
      EstablishChannelType.EstablishChannelRequest,
    ) as JSONWebToken<EstablishChannelRequest>

    return this.ctx.ctx.identityWallet.create.message(
      {
        message: { transportIdx },
        typ: EstablishChannelType.EstablishChannelResponse,
      },
      await this.ctx.ctx.keyChainLib.getPassword(),
      request,
    )
  }

  public async createResolutionResponse() {
    const request = this.findMessageByType(
      ResolutionType.ResolutionRequest,
    ) as JSONWebToken<ResolutionRequest>
    const { requested } = this.getSummary().state as ResolutionFlowState

    return this.ctx.ctx.identityWallet.create.message(
      {
        message: {
          '@context': 'https://www.w3.org/ns/did-resolution/v1',
          didDocument: (
            await this.ctx.ctx.didMethods
              .getDefault()
              .resolver.resolve(requested)
          ).didDocument.toJSON(),
          resolverMetadata: {
            driverId: this.ctx.ctx.identityWallet.did,
            driver: 'jolocom/peer-resolution/0.1',
            retrieved: Date.now(),
          },
          methodMetadata: {
            stateProof: await this.ctx.ctx.storageLib.eventDB
              .read(requested.split(':')[-1])
              .catch(e => {
                return []
              }),
          },
        },
        typ: ResolutionType.ResolutionResponse,
      },
      await this.ctx.ctx.keyChainLib.getPassword(),
      request,
    )
  }

  public async createAuthorizationResponse() {
    const request = this.findMessageByType(
      AuthorizationType.AuthorizationRequest,
    ) as JSONWebToken<AuthorizationRequest>

    const { description, imageURL, action } = this.getSummary()
      .state as AuthorizationFlowState

    return this.ctx.ctx.identityWallet.create.message(
      {
        message: {
          description,
          ...(imageURL && { imageURL }),
          ...(action && { action }),
        },
        typ: AuthorizationType.AuthorizationResponse,
      },
      await this.ctx.ctx.keyChainLib.getPassword(),
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

    return this.ctx.ctx.identityWallet.create.interactionTokens.response.share(
      {
        callbackURL: request.interactionToken.callbackURL,
        suppliedCredentials: credentials.map(c => c.toJSON()),
      },
      await this.ctx.ctx.keyChainLib.getPassword(),
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

    return this.ctx.ctx.identityWallet.create.interactionTokens.response.offer(
      credentialOfferResponseAttr,
      await this.ctx.ctx.keyChainLib.getPassword(),
      credentialOfferRequest,
    )
  }

  public async issueSelectedCredentials(offerMap?: {
    [k: string]: (
      inp?: any,
    ) => Promise<{ claim: any; metadata?: any; subject?: string }>
  }): Promise<SignedCredential[]> {
    const flowState = this.flow.state as CredentialOfferFlowState
    const password = await this.ctx.ctx.keyChainLib.getPassword()
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

  public async createCredentialReceiveToken(customCreds?: SignedCredential[]) {
    let creds = customCreds || (await this.issueSelectedCredentials())

    const request = this.findMessageByType(
      InteractionType.CredentialOfferResponse,
    ) as JSONWebToken<CredentialOfferResponse>

    return this.ctx.ctx.identityWallet.create.interactionTokens.response.issue(
      {
        signedCredentials: creds.map(c => c.toJSON()),
      },
      await this.ctx.ctx.keyChainLib.getPassword(),
      request,
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
  public async processInteractionToken<T>(
    token: JSONWebToken<T>,
  ): Promise<boolean> {
    if (!this.participants.requester) {
      // TODO what happens if the signer isnt resolvable
      const requester = this.participants.requester =
        await this.ctx.ctx.didMethods.getDefault()
          .resolver.resolve(token.signer.did)
      
      if (requester.did === this.ctx.ctx.identityWallet.did) {
        this.participants.responder = this.ctx.ctx.identityWallet.identity
        this.role = InteractionRole.Requester
      }
    } else if (!this.participants.responder) {
      const responder = this.participants.responder =
        await this.ctx.ctx.didMethods.getDefault()
          .resolver.resolve(token.signer.did)
      if (responder.did === this.ctx.ctx.identityWallet.did) {
        this.role = InteractionRole.Responder
      }
    }

    return this.flow.handleInteractionToken(token).then(res => {
      this.interactionMessages.push(token)
      // this.ctx.ctx.storageLib.store.interactionToken(token)
      return res
    })
  }

  public async createEncResponseToken(): Promise<
    JSONWebToken<EncryptionResponse>
  > {
    const encRequest = this.findMessageByType(
      EncryptionType.EncryptionRequest,
    ) as JSONWebToken<EncryptionRequest>

    return this.ctx.ctx.identityWallet.create.message(
      {
        message: {
          callbackURL: encRequest.payload.interactionToken!.callbackURL,
          // @ts-ignore
          result: await this.ctx.ctx.identityWallet.asymEncryptToDidKey(
            Buffer.from(
              encRequest.payload.interactionToken!.request.data,
              'base64',
            ),
            encRequest.payload.interactionToken!.request.target,
          ),
        },
        typ: EncryptionType.EncryptionResponse,
      },
      await this.ctx.ctx.keyChainLib.getPassword(),
      encRequest,
    )
  }

  public async createDecResponseToken(): Promise<
    JSONWebToken<DecryptionResponse>
  > {
    const decRequest = this.findMessageByType(
      DecryptionType.DecryptionRequest,
    ) as JSONWebToken<DecryptionRequest>
    const password = await this.ctx.ctx.keyChainLib.getPassword()
    return this.ctx.ctx.identityWallet.create.message(
      {
        message: {
          callbackURL: decRequest.payload.interactionToken!.callbackURL,
          result: await this.ctx.ctx.identityWallet
            .asymDecrypt(decRequest.payload.interactionToken!.request, password)
            .then(buf => buf.toString()),
        },
        typ: DecryptionType.DecryptionResponse,
      },
      password,
      decRequest,
    )
  }

  public getSummary(): InteractionSummary {
    return {
      initiator: generateIdentitySummary(this.participants.requester!),
      state: this.flow.getState(),
    }
  }

  public getAttributesByType = (type: string[]) => {
    return this.ctx.ctx.storageLib.get.attributesByType(type)
  }

  public async getStoredCredentialById(id: string) {
    return this.ctx.ctx.storageLib.get.verifiableCredential({
      id,
    })
  }

  public getVerifiableCredential = (query?: object) => {
    return this.ctx.ctx.storageLib.get.verifiableCredential(query)
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

  public async send<T>(token: JSONWebToken<T>) {
    // @ts-ignore - CredentialReceive has no callbackURL, needs fix on the lib for JWTEncodable.
    const { callbackURL } = token.interactionToken
    return this.transportAPI.send(token)
  }

  private checkFlow(flow: FlowType) {
    if (this.flow.type !== flow) throw new AppError(ErrorCode.WrongFlow)
  }

  public storeSelectedCredentials() {
    this.checkFlow(FlowType.CredentialOffer)

    const { issued, credentialsValidity } = this.flow
      .state as CredentialOfferFlowState

    if (!issued.length)
      throw new AppError(ErrorCode.SaveExternalCredentialFailed)

    return Promise.all(
      issued.map((cred, i) => {
        credentialsValidity[i] &&
          this.ctx.ctx.storageLib.store.verifiableCredential(cred)
      }),
    )
  }

  public storeCredentialMetadata() {
    this.checkFlow(FlowType.CredentialOffer)

    const { offerSummary, selection, credentialsValidity } = this.flow
      .state as CredentialOfferFlowState

    if (!selection.length)
      throw new AppError(ErrorCode.SaveCredentialMetadataFailed)

    const issuer = generateIdentitySummary(this.participants.requester!)

    return Promise.all(
      selection.map(({ type }, i) => {
        const metadata = offerSummary.find(metadata => metadata.type === type)

        metadata &&
          credentialsValidity[i] &&
          this.ctx.ctx.storageLib.store.credentialMetadata({
            ...metadata,
            issuer,
          })
      }),
    )
  }

  public storeIssuerProfile() {
    return this.ctx.ctx.storageLib.store.issuerProfile(
      generateIdentitySummary(this.participants.requester!),
    )
  }
}
