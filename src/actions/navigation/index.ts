import { routeList } from 'src/routeList'
import { JolocomLib } from 'jolocom-lib'
import { interactionHandlers } from 'src/lib/storage/interactionTokens'
import { AppError, ErrorCode } from 'src/lib/errors'
import { withErrorScreen, withLoading } from 'src/actions/modifiers'
import { ThunkAction } from 'src/store'
import { InteractionChannel } from '../../lib/interactionManager/types'

/**
 * NOTE: navigate and navigatorReset both dispatch the navigation actions but
 * the actions are not handled by our reducers. Dispatching is useful for testing
 * (comparing snapshots of store actions) and it makes typescript happy
 */
export const navigate = (options: any): ThunkAction => dispatch => {
  return Promise.resolve()
}

export const navigatorReset = (newScreen?: any): ThunkAction => dispatch => {
  return Promise.resolve()
}

export const navigatorResetHome = (): ThunkAction => dispatch =>
  dispatch(navigatorReset({ routeName: routeList.Home }))

/**
 * The function that parses a deep link to get the route name and params
 * It then matches the route name and dispatches a corresponding action
 * @param url - a deep link string with the following schema: appName://routeName/params
 */
export const handleDeepLink = (url: string): ThunkAction => (
  dispatch,
  getState,
  backendMiddleware,
) => {
  // The identityWallet is initialised before the deep link is handled. If it
  // is not initialized, then we may not even have an identity.
  if (!backendMiddleware.identityWallet) {
    return dispatch(
      navigate({
        routeName: routeList.Landing,
      }),
    )
  }

  let routeName = '',
    params = ''

  if (url) {
    const [scheme, uri] = url.split('://')
    if (scheme && uri) {
      const parts = uri.split('/')
      if (scheme.startsWith('http')) {
        routeName = parts[1]
        params = parts[2]
      } else {
        routeName = parts[0]
        params = parts[1]
      }
    }
  }

  const supportedRoutes = ['consent', 'payment', 'authenticate']
  if (supportedRoutes.includes(routeName)) {
    const interactionToken = JolocomLib.parse.interactionToken.fromJWT(params)
    const handler = interactionHandlers[interactionToken.interactionType]

    if (handler) {
      return dispatch(
        withLoading(
          withErrorScreen(
            handler(interactionToken, InteractionChannel.Deeplink),
          ),
        ),
      )
    }
  }

  /** @TODO Use error code */
  throw new AppError(
    ErrorCode.ParseJWTFailed,
    new Error('Could not handle interaction token'),
  )
}
