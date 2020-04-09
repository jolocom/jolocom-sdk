import { JSONWebToken } from 'jolocom-lib/js/interactionTokens/JSONWebToken'
import { navigationActions } from 'src/actions'
import { routeList } from 'src/routeList'
import { PaymentRequest } from 'jolocom-lib/js/interactionTokens/paymentRequest'
import { JolocomLib } from 'jolocom-lib'
import { Linking } from 'src/polyfills/reactNative'
import { cancelSSO } from 'src/actions/sso'
import { JolocomRegistry } from 'jolocom-lib/js/registries/jolocomRegistry'
import { ThunkDispatch } from '../../store'
import { RootState } from '../../reducers'
import { BackendMiddleware } from '../../backendMiddleware'
import { AppError, ErrorCode } from 'src/lib/errors'
import { keyIdToDid } from 'jolocom-lib/js/utils/helper'
import { generateIdentitySummary } from './utils'
import { PaymentRequestSummary } from './types'
import fetch from 'node-fetch'

/**
 * @dev Given that this functionality might be deprecated soon (at least in it's current form),
 * the payment interactions were not integrated with the {@link InteractionManager}
 */

export const consumePaymentRequest = (
  paymentRequest: JSONWebToken<PaymentRequest>,
  isDeepLinkInteraction: boolean = false,
) => async (
  dispatch: ThunkDispatch,
  getState: () => RootState,
  backendMiddleware: BackendMiddleware,
) => {
  const { identityWallet, registry } = backendMiddleware

  await identityWallet.validateJWT(
    paymentRequest,
    undefined,
    registry as JolocomRegistry,
  )

  const requester = await registry.resolve(keyIdToDid(paymentRequest.issuer))

  const requesterSummary = generateIdentitySummary(requester)

  const paymentDetails: PaymentRequestSummary = {
    receiver: {
      did: paymentRequest.issuer,
      address: paymentRequest.interactionToken.transactionOptions.to as string,
    },
    requester: requesterSummary,
    requestJWT: paymentRequest.encode(),
    callbackURL: paymentRequest.interactionToken.callbackURL,
    amount: paymentRequest.interactionToken.transactionOptions.value,
    description: paymentRequest.interactionToken.description,
  }

  return dispatch(
    navigationActions.navigate({
      routeName: routeList.PaymentConsent,
      params: { isDeepLinkInteraction, paymentDetails },
      key: 'paymentRequest',
    }),
  )
}

export const sendPaymentResponse = (
  isDeepLinkInteraction: boolean,
  paymentDetails: PaymentRequestSummary,
) => async (
  dispatch: ThunkDispatch,
  getState: () => RootState,
  backendMiddleware: BackendMiddleware,
) => {
  const { identityWallet } = backendMiddleware
  const { callbackURL, requestJWT } = paymentDetails

  // add loading screen here
  const password = await backendMiddleware.keyChainLib.getPassword()
  const decodedPaymentRequest = JolocomLib.parse.interactionToken.fromJWT<
    PaymentRequest
  >(requestJWT)
  const txHash = await identityWallet.transactions.sendTransaction(
    decodedPaymentRequest.interactionToken,
    password,
  )
  const response = await identityWallet.create.interactionTokens.response.payment(
    { txHash },
    password,
    decodedPaymentRequest,
  )

  if (isDeepLinkInteraction) {
    const callback = `${callbackURL}/${response.encode()}`
    if (!(await Linking.canOpenURL(callback))) {
      throw new AppError(ErrorCode.DeepLinkUrlNotFound)
    }

    return Linking.openURL(callback).then(() => dispatch(cancelSSO))
  } else {
    return fetch(callbackURL, {
      method: 'POST',
      body: JSON.stringify({ token: response.encode() }),
      headers: { 'Content-Type': 'application/json' },
    }).then(() => dispatch(cancelSSO))
  }
}
