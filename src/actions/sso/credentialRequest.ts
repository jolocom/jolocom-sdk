import { navigationActions } from '../../actions'
import { routeList } from '../../routeList'
import { JSONWebToken } from 'jolocom-lib/js/interactionTokens/JSONWebToken'
import { CredentialRequest } from 'jolocom-lib/js/interactionTokens/credentialRequest'
import { ThunkAction } from '../../store'
import { CredentialVerificationSummary } from '../../lib/interactionManager/types'
import { InteractionChannel } from '../../lib/interactionManager/types'
import { Interaction } from '../../lib/interactionManager/interaction'
import { cancelSSO } from './'
import { CredentialRequestFlow } from '../../lib/interactionManager/credentialRequestFlow'

export const consumeCredentialRequest = (
  credentialRequest: JSONWebToken<CredentialRequest>,
  interactionChannel: InteractionChannel, // TODO replace with send function at one point
): ThunkAction => async (dispatch, getState, backendMiddleware) => {
  const { interactionManager } = backendMiddleware

  const interaction = await interactionManager.start(
    interactionChannel,
    credentialRequest,
  )

  return dispatch(
    navigationActions.navigate({
      routeName: routeList.Consent,
      params: {
        interactionId: interaction.id,
        interactionSummary: interaction.getSummary(),
        availableCreds: await (interaction.flow as CredentialRequestFlow).getAvailableCredentials(
          credentialRequest.interactionToken,
        ),
      },
      key: 'credentialRequest',
    }),
  )
}

export const sendCredentialResponse = (
  selectedCredentials: CredentialVerificationSummary[],
  interactionId: string,
): ThunkAction => async (dispatch, getState, { interactionManager }) => {
  const interaction: Interaction = interactionManager.getInteraction(
    interactionId,
  )

  return interaction
    .send(await interaction.createCredentialResponse(selectedCredentials))
    .then(() => dispatch(cancelSSO))
}
