import { CredentialOfferRequest } from 'jolocom-lib/js/interactionTokens/credentialOfferRequest'
import { CredentialOfferResponse } from 'jolocom-lib/js/interactionTokens/credentialOfferResponse'
import { CredentialsReceive } from 'jolocom-lib/js/interactionTokens/credentialsReceive'
import { InteractionType, CredentialOfferResponseSelection } from '@jolocom/protocol-ts'
import { JolocomLib } from 'jolocom-lib'
import { last } from 'ramda'
import { CredentialType } from '../credentials'
import { Flow } from './flow'
import { Interaction } from './interaction'
import { CredentialOfferFlowState, IssuanceResult, FlowType } from './types'
import {
  isCredentialOfferRequest,
  isCredentialOfferResponse,
  isCredentialReceive,
} from './guards'
import { SignedCredential } from 'jolocom-lib/js/credentials/signedCredential/signedCredential'
import { CredentialMetadataSummary } from '../types'
import { generateIdentitySummary } from '../util'

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
  public static type = FlowType.CredentialOffer
  public static firstMessageType = InteractionType.CredentialOfferRequest

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
    const selectedCreds = token.selectedCredentials
    // First we check if all selected offers were actually offered
    const selectedTypes = selectedCreds.map(offer => offer.type)
    if (!this.areTypesOffered(selectedTypes)) {
      throw new Error('Invalid offer type in offer response')
    }

    // If all is good, then we update the 'selection' and 'selectedTypes' state,
    // and we keep them in the same order as the offer
    const selection: CredentialOfferResponseSelection[] = []
    this.state.offerSummary.forEach(o => {
      const selected = selectedCreds.find(cred => cred.type === o.type)
      if (selected) selection.push(selected)
    })

    this.state.selection = selection
    this.state.selectedTypes = selection.map(s => s.type)

    return true
  }

  // Sets the state of issued credentials and their validity
  private async handleCredentialReceive({
    signedCredentials,
  }: CredentialsReceive) {
    // First we check if all received credentials were actually offered
    const issuedTypes = signedCredentials.map(cred => last(cred.type) || '')
    if (!this.areTypesOffered(issuedTypes)) {
      throw new Error('Received wrong credentials')
    }

    // Then we compute the list of issued credential and their validity,
    // maintaining order as per the offer
    const issued: SignedCredential[] = []
    this.state.offerSummary.forEach(o => {
      const selected = signedCredentials.find(cred => last(cred.type) === o.type)
      if (selected) issued.push(selected)
    })
    this.state.issued = issued
    const validArr = (this.state.credentialsValidity = await Promise.all(
      issued.map(async cred => {
        try {
          await JolocomLib.parseAndValidate.signedCredential(
            cred.toJSON(),
            await this.ctx.ctx.ctx.resolve(cred.issuer),
          )
        } catch (e) {
          // credential signature is invalid!
          return false
        }

        const validIssuer = cred.issuer === this.ctx.participants.requester!.did
        const validSubject = cred.subject === this.ctx.participants.responder!.did
        return validIssuer && validSubject
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

      return {
        ...offer,
        signedCredential: cred,
        validationErrors,
      }
    })
  }

  public getOfferDisplay() {
    const metadatas = this.getOfferedCredentialMetadata()
    return this.state.offerSummary.map((oc, idx) => {
      const claim = this.state.issued[idx]?.claim
      // NOTE: currently CredentialOffer assumes a fixed value of the type array
      const fullType = ['VerifiableCredential', oc.type]
      const credType = new CredentialType(fullType, metadatas[oc.type])
      return credType.display(claim)
    })
  }

  public getOfferedCredentialMetadata(): Record<string, CredentialMetadataSummary> {
    const issuer = generateIdentitySummary(this.ctx.participants.requester!)
    const metadatas = {}
    this.state.offerSummary.forEach(metadata => {
      metadatas[metadata.type] = {
        ...metadata,
        issuer,
      }
    })
    return metadatas
  }
}
