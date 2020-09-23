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
  EncryptionRequest,
  EncryptionResponse,
  DecryptionRequest,
  DecryptionResponse,
  SigningRequest,
  SigningResponse,
  SigningType,
} from './types'
import { CredentialRequestFlow } from './credentialRequestFlow'
import { Flow } from './flow'
import { CredentialOfferRequest } from 'jolocom-lib/js/interactionTokens/credentialOfferRequest'
import { AuthenticationFlow } from './authenticationFlow'
import { CredentialRequest } from 'jolocom-lib/js/interactionTokens/credentialRequest'
import { SDKError, ErrorCode } from '../errors'
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
} from './interactionManager'

import { SignedCredential } from 'jolocom-lib/js/credentials/signedCredential/signedCredential'
import { CredentialOfferResponse } from 'jolocom-lib/js/interactionTokens/credentialOfferResponse'

import { EncryptionFlow } from './encryptionFlow'
import { DecryptionFlow } from './decryptionFlow'
import { SigningFlow } from './signingFlow'
import { generateIdentitySummary } from '../util'

import {
  ResolutionType,
  ResolutionFlow,
  ResolutionFlowState,
  ResolutionRequest,
} from './resolutionFlow'
import { last } from 'ramda'
import { TransportAPI, TransportDesc, InteractionTransportType } from '../types'
import { Transportable } from '../transports'

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
  [SigningType.SigningRequest]: SigningFlow,
}

export class Interaction<F extends Flow<any> = Flow<any>> extends Transportable {
  private messages: Array<JSONWebToken<any>> = []
  public id: string
  public ctx: InteractionManager
  public flow: F

  public participants: {
    [k in InteractionRole]?: Identity
  } = {}

  role?: InteractionRole

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
      await this.ctx.ctx.passwordStore.getPassword(),
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

    const stateId = last(uriToResolve.split(':')) || ''

    const stateProof = await this.ctx.ctx.storage.eventDB
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
      await this.ctx.ctx.passwordStore.getPassword(),
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
      await this.ctx.ctx.passwordStore.getPassword(),
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
      await this.ctx.ctx.passwordStore.getPassword(),
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
      await this.ctx.ctx.passwordStore.getPassword(),
      credentialOfferRequest,
    )
  }

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

    // TODO if handling fails, should we still be pushing the token??
    const res = await this.flow.handleInteractionToken(token)
    this.messages.push(token)
    await this.ctx.ctx.storage.store.interactionToken(token)

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

    return this.ctx.ctx.identityWallet.create.message(
      {
        message: {
          callbackURL: encRequest.payload.interactionToken!.callbackURL,
          result: result.toString('base64'),
        },
        typ: EncryptionType.EncryptionResponse,
      },
      await this.ctx.ctx.passwordStore.getPassword(),
      encRequest,
    )
  }

  public async createDecResponseToken(): Promise<
    JSONWebToken<DecryptionResponse>
  > {
    const decRequest = this.findMessageByType(
      DecryptionType.DecryptionRequest,
    ) as JSONWebToken<DecryptionRequest>

    const password = await this.ctx.ctx.passwordStore.getPassword()

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
    const pass = await this.ctx.ctx.passwordStore.getPassword()
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
    return this.ctx.ctx.storage.get.attributesByType(type)
  }

  public async getStoredCredentialById(id: string) {
    return this.ctx.ctx.storage.get.verifiableCredential({
      id,
    })
  }

  public async getVerifiableCredential(query?: object) {
    return this.ctx.ctx.storage.get.verifiableCredential(query)
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
    return this.transportAPI.send(token.encode())
  }

  private checkFlow(flow: FlowType) {
    if (this.flow.type !== flow) throw new SDKError(ErrorCode.WrongFlow)
  }

  public async storeSelectedCredentials() {
    this.checkFlow(FlowType.CredentialOffer)

    const { issued, credentialsValidity } = this.flow
      .state as CredentialOfferFlowState

    if (!issued.length) {
      throw new SDKError(ErrorCode.SaveExternalCredentialFailed)
    }

    return Promise.all(
      issued
        .filter((cred, i) => credentialsValidity[i])
        .map(async cred =>
          this.ctx.ctx.storage.store.verifiableCredential(cred),
        ),
    )
  }

  public async storeCredentialMetadata() {
    this.checkFlow(FlowType.CredentialOffer)

    const { offerSummary, selection, credentialsValidity } = this.flow
      .state as CredentialOfferFlowState

    if (!selection.length) {
      throw new SDKError(ErrorCode.SaveCredentialMetadataFailed)
    }

    const issuer = generateIdentitySummary(this.participants.requester!)

    return Promise.all(
      selection.map(({ type }, i) => {
        const metadata = offerSummary.find(metadata => metadata.type === type)

        if (metadata && credentialsValidity[i]) {
          return this.ctx.ctx.storage.store.credentialMetadata({
            ...metadata,
            issuer,
          })
        }

        return
      }),
    )
  }

  public async storeIssuerProfile() {
    return this.ctx.ctx.storage.store.issuerProfile(
      generateIdentitySummary(this.participants.requester!),
    )
  }
}
