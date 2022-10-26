import { InteractionType } from 'jolocom-lib/js/interactionTokens/types'
import { CredentialRequest } from 'jolocom-lib/js/interactionTokens/credentialRequest'
import { Interaction } from './interaction'
import { Flow } from './flow'
import { CredentialResponse } from 'jolocom-lib/js/interactionTokens/credentialResponse'
import { CredentialRequestFlowState, FlowType } from './types'
import { isCredentialRequest, isCredentialResponse } from './guards'
import { validateDigestable } from 'jolocom-lib/js/utils/validation'
import { ErrorCode, SDKError } from '../errors'

export class CredentialRequestFlow extends Flow<
  CredentialRequest | CredentialResponse
> {
  public state: CredentialRequestFlowState = {
    constraints: [],
    providedCredentials: [],
    validityMap: [],
  }
  public static type = FlowType.CredentialShare
  public static firstMessageType = InteractionType.CredentialRequest

  constructor(ctx: Interaction) {
    super(ctx)
  }

  /*
   * Implementation of the abstract handler defined in {@link Flow}
   * Given an interaction token, will fire the appropriate step in the protocol or throw
   */

  public async handleInteractionToken(
    token: CredentialRequest | CredentialResponse,
    interactionType: string,
  ) {
    switch (interactionType) {
      case InteractionType.CredentialRequest:
        if (isCredentialRequest(token)) {
          return this.handleCredentialRequest(token)
        }
      case InteractionType.CredentialResponse:
        if (isCredentialResponse(token)) {
          return this.handleCredentialResponse(token)
        }
      default:
        throw new Error('Interaction type not found')
    }
  }

  private async handleCredentialRequest(request: CredentialRequest) {
    this.state.constraints.push(request)
    return true
  }

  private async handleCredentialResponse(token: CredentialResponse) {
    this.state.providedCredentials.push(token)
    const lastIndex = this.state.constraints.length - 1

    this.state.validityMap = await Promise.all(
      token.suppliedCredentials.map(async vc => {
        // Failing to resolve the issuer throws an error, instead
        // we'd like a boolean flag
        let validityCheck = validateDigestable(vc, this.ctx.ctx.ctx.resolver).catch(_ => false);

        return validityCheck.then(signatureValid => ({
          credentialId: vc.id,
          expired: vc.expires <= new Date(),
          signatureInvalid: !signatureValid,
        }))
      }),
    )

    const any_invalid = this.state.validityMap.some(
      ({ expired, signatureInvalid }) => expired || signatureInvalid,
    )

    if (any_invalid) {
      throw new SDKError(
        ErrorCode.CredentialResponseFailed,
        new Error("Presented credentials are not valid")
      )
    }

    if (lastIndex >= 0) {
      return token.satisfiesRequest(this.state.constraints[lastIndex])
    } else return true
  }
}
