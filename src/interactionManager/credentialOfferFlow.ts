import { CredentialOfferRequest } from 'jolocom-lib/js/interactionTokens/credentialOfferRequest'
import { CredentialOfferResponse } from 'jolocom-lib/js/interactionTokens/credentialOfferResponse'
import { CredentialsReceive } from 'jolocom-lib/js/interactionTokens/credentialsReceive'
import { InteractionType } from 'jolocom-lib/js/interactionTokens/types'
import { JolocomLib } from 'jolocom-lib'
import { last } from 'ramda'
import { Flow } from './flow'
import { Interaction } from './interaction'
import { CredentialOfferFlowState, IssuanceResult, FlowType } from './types'
import {
  isCredentialOfferRequest,
  isCredentialOfferResponse,
  isCredentialReceive,
} from './guards'

export class CredentialOfferFlow extends Flow<
  CredentialOfferRequest | CredentialOfferResponse | CredentialsReceive
  > {
  public state: CredentialOfferFlowState = {
    offerSummary: [],
    selection: [],
    selectedTypes: [],
    issued: [],
    credentialsValidity: [],
    credentialsAllValid: true,
  }
  public type = FlowType.CredentialOffer

  public constructor(ctx: Interaction) {
    super(ctx)
  }

  public async handleInteractionToken(
    token:
      | CredentialOfferRequest
      | CredentialOfferResponse
      | CredentialsReceive,
    interactionType: string,
  ): Promise<boolean> {
    switch (interactionType) {
      case InteractionType.CredentialOfferRequest:
        if (isCredentialOfferRequest(token)) {
          return this.handleOfferRequest(token)
        }
      case InteractionType.CredentialOfferResponse:
        if (isCredentialOfferResponse(token)) {
          return this.handleOfferResponse(token)
        }
      case InteractionType.CredentialsReceive:
        if (isCredentialReceive(token)) {
          return this.handleCredentialReceive(token)
        }
      default:
        throw new Error('Interaction type not found')
    }
  }

  private handleOfferRequest(offer: CredentialOfferRequest) {
    this.state.offerSummary = offer.offeredCredentials
    return true
  }

  private areTypesOffered(types: string[]) {
    const { offerSummary } = this.state
    if (!offerSummary) return false
    return types.every(type => offerSummary.find(o => o.type == type))
  }

  private async handleOfferResponse(token: CredentialOfferResponse) {
    const selectedOffers = token.selectedCredentials
    const selectedTypes = selectedOffers.map(offer => offer.type)
    if (!this.areTypesOffered(selectedTypes)) {
      throw new Error('Invalid offer type in offer response')
    }
    this.state.selection = selectedOffers
    this.state.selectedTypes = selectedTypes

    return true
  }

  // Sets the validity map, currently if the issuer and if the subjects are correct.
  // also populates the SignedCredentialWithMetadata with credentials
  private async handleCredentialReceive({
    signedCredentials,
  }: CredentialsReceive) {
    this.state.issued = signedCredentials
    this.state.issued.map(cred => {
      const offer = this.state.offerSummary.find(
        ({ type }) => type === last(cred.type),
      )

      if (!offer) {
        throw new Error('Received wrong credentials')
      }
    })

    const validArr = (this.state.credentialsValidity = await Promise.all(
      signedCredentials.map(async cred => {
        try {
          await JolocomLib.parseAndValidate.signedCredential(
            cred.toJSON(),
            await this.ctx.ctx.ctx.resolve(cred.issuer),
          )
        } catch (e) {
          return false
        }
        return true
      }),
    ))
    this.state.credentialsAllValid = validArr.every(v => v)
    return true
  }

  // return a list of types which are both offered and requested
  public getSelectionResult(): string[] {
    const offeredTypes = this.state.offerSummary.map(o => o.type)
    const selectedTypes = this.state.selection.map(s => s.type)

    return offeredTypes.filter(ot => selectedTypes.includes(ot))
  }

  public getIssuanceResult(): IssuanceResult {
    return this.state.issued.map((cred, i) => {
      const offer = this.state.offerSummary.find(
        ({ type }) => type === last(cred.type),
      )

      if (!offer) {
        throw new Error('Received wrong credentials')
      }

      const validationErrors = {
        invalidIssuer: cred.issuer !== this.ctx.participants.requester!.did,
        invalidSubject: cred.subject !== this.ctx.participants.responder!.did,
      }

      if (validationErrors.invalidIssuer || validationErrors.invalidSubject) {
        this.state.credentialsValidity[i] = false
        this.state.credentialsAllValid = false
      }

      return {
        ...offer,
        signedCredential: cred,
        validationErrors,
      }
    })
  }
}
