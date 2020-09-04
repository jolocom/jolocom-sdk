import { CredentialOfferFlow } from './credentialOfferFlow'
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
  SigningType,
  EncryptionRequest,
  EncryptionResponse,
  DecryptionRequest,
  DecryptionResponse,
  SigningRequest,
  SigningResponse,
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

import {
  ResolutionType,
  ResolutionFlow,
  ResolutionFlowState,
  ResolutionRequest,
} from './resolutionFlow'
import { last } from 'ramda'

import { SignedCredential } from 'jolocom-lib/js/credentials/signedCredential/signedCredential'
import { CredentialOfferResponse } from 'jolocom-lib/js/interactionTokens/credentialOfferResponse'

import { EncryptionFlow } from './encryptionFlow'
import { DecryptionFlow } from './decryptionFlow'
import { SigningFlow } from './signingFlow'
import { generateIdentitySummary } from '../../utils/generateIdentitySummary'

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
  [ResolutionType.ResolutionRequest]: ResolutionFlow,
  [EstablishChannelType.EstablishChannelRequest]: EstablishChannelFlow,
  [EncryptionType.EncryptionRequest]: EncryptionFlow,
  [DecryptionType.DecryptionRequest]: DecryptionFlow,
  [SigningType.SigningRequest]: SigningFlow,
}

export class Interaction {
  private interactionMessages: Array<JSONWebToken<any>> = []
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

  public async createResolutionResponse() {
    const request = this.findMessageByType(
      ResolutionType.ResolutionRequest,
    ) as JSONWebToken<ResolutionRequest>
    const reqMessage = (this.flow.state as ResolutionFlowState).request
    const uriToResolve = (reqMessage && reqMessage.uri) || this.ctx.ctx.idw.did

    const stateId = last(uriToResolve.split(':')) || ''

    const stateProof = await this.ctx.ctx.storageLib.eventDB
      .read(stateId)
      .catch((_: any) => [])

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

  public async createCredentialResponse(selectedCredentials: string[]) {
    const request = this.findMessageByType(
      InteractionType.CredentialRequest,
    ) as JSONWebToken<CredentialRequest>

    const credentials = await Promise.all(
      selectedCredentials.map(
        async id => (await this.getVerifiableCredential({ id }))[0],
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
    selectedOffering: CredentialOfferResponseSelection[],
  ) {
    const credentialOfferRequest = this.findMessageByType(
      InteractionType.CredentialOfferRequest,
    ) as JSONWebToken<CredentialOfferRequest>

    const credentialOfferResponseAttr = {
      callbackURL: credentialOfferRequest.interactionToken.callbackURL,
      selectedCredentials: selectedOffering,
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
    const creds = customCreds || (await this.issueSelectedCredentials())

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
      try {
        const requester = await this.ctx.ctx.resolve(token.signer.did)
        this.participants.requester = requester
        if (requester.did === this.ctx.ctx.identityWallet.did) {
          this.role = InteractionRole.Requester
        }
      } catch (err) {
        // TODO what should we do if the signer isnt resolvable
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

    const res = await this.flow.handleInteractionToken(token)
    this.interactionMessages.push(token)
    await this.ctx.ctx.storageLib.store.interactionToken(token)
    return res
  }

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
        this.ctx.ctx.resolver,
      )
    } else if (targetParts.length === 1) {
      // it does not include a keyRef
      result = await this.ctx.ctx.identityWallet.asymEncryptToDid(
        data,
        msg.target,
        this.ctx.ctx.resolver,
      )
    } else {
      throw new Error('bad encryption target: ' + msg.target)
    }

    return this.ctx.ctx.identityWallet.create.message(
      {
        message: {
          callbackURL: encRequest.payload.interactionToken!.callbackURL,
          result: result.toString('base64'),
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
      },
      password,
      decRequest,
    )
  }

  public async createSigningResponseToken(): Promise<
    JSONWebToken<SigningResponse>
  > {
    const sigRequest = this.findMessageByType(
      SigningType.SigningRequest,
    ) as JSONWebToken<SigningRequest>
    const pass = await this.ctx.ctx.keyChainLib.getPassword()
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

  public async getAttributesByType(type: string[]) {
    return this.ctx.ctx.storageLib.get.attributesByType(type)
  }

  public async getStoredCredentialById(id: string) {
    return this.ctx.ctx.storageLib.get.verifiableCredential({
      id,
    })
  }

  public async getVerifiableCredential(query?: object) {
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

  public async storeSelectedCredentials() {
    this.checkFlow(FlowType.CredentialOffer)

    const { issued, credentialsValidity } = this.flow
      .state as CredentialOfferFlowState

    if (!issued.length) {
      throw new AppError(ErrorCode.SaveExternalCredentialFailed)
    }

    return Promise.all(
      issued
        .filter((cred, i) => credentialsValidity[i])
        .map(async cred =>
          this.ctx.ctx.storageLib.store.verifiableCredential(cred),
        ),
    )
  }

  public async storeCredentialMetadata() {
    this.checkFlow(FlowType.CredentialOffer)

    const { offerSummary, selection, credentialsValidity } = this.flow
      .state as CredentialOfferFlowState

    if (!selection.length) {
      throw new AppError(ErrorCode.SaveCredentialMetadataFailed)
    }

    const issuer = generateIdentitySummary(this.participants.requester!)

    return Promise.all(
      selection.map(({ type }, i) => {
        const metadata = offerSummary.find(metadata => metadata.type === type)

        if (metadata && credentialsValidity[i]) {
          return this.ctx.ctx.storageLib.store.credentialMetadata({
            ...metadata,
            issuer,
          })
        }

        return
      }),
    )
  }

  public async storeIssuerProfile() {
    return this.ctx.ctx.storageLib.store.issuerProfile(
      generateIdentitySummary(this.participants.requester!),
    )
  }
}
