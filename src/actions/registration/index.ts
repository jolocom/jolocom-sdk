import { navigationActions } from '../../actions/'
import { routeList } from '../../routeList'
import * as loading from '../../actions/registration/loadingStages'
import { setDid } from '../../actions/account'
import { ThunkAction } from '../../store'
import { navigatorResetHome } from '../navigation'
import { setSeedPhraseSaved } from '../recovery'

export const setLoadingMsg = (loadingMsg: string) => ({
  type: 'SET_LOADING_MSG',
  value: loadingMsg,
})

export const setIsRegistering = (value: boolean) => ({
  type: 'SET_IS_REGISTERING',
  value,
})

export const createIdentity = (encodedEntropy: string): ThunkAction => async (
  dispatch,
  getState,
  backendMiddleware,
) => {
  dispatch(
    navigationActions.navigate({
      routeName: routeList.RegistrationProgress,
    }),
  )

  const isRegistering = getState().registration.loading.isRegistering
  if (isRegistering) return

  dispatch(setIsRegistering(true))

  dispatch(setLoadingMsg(loading.loadingStages[0]))
  await backendMiddleware.createKeyProvider(encodedEntropy)

  dispatch(setLoadingMsg(loading.loadingStages[1]))
  await backendMiddleware.fuelKeyWithEther()

  dispatch(setLoadingMsg(loading.loadingStages[2]))
  const identity = await backendMiddleware.createIdentity()

  dispatch(setDid(identity.did))
  dispatch(setLoadingMsg(loading.loadingStages[3]))
  dispatch(setIsRegistering(false))

  return dispatch(navigatorResetHome())
}

export const recoverIdentity = (mnemonic: string): ThunkAction => async (
  dispatch,
  getState,
  backendMiddleware,
) => {
  dispatch(setIsRegistering(true))
  let identity
  identity = await backendMiddleware.recoverIdentity(mnemonic)

  dispatch(setDid(identity.did))
  dispatch(setSeedPhraseSaved())

  dispatch(setIsRegistering(false))
  return dispatch(navigatorResetHome())
}
