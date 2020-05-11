import { navigationActions } from '../../actions/'
import { routeList } from '../../routeList'
import SplashScreen from '../../polyfills/rnSplashScreen'
// import I18n from '../../locales/i18n'
import { ThunkAction } from '../../store'
import { AppError, ErrorCode } from '../../lib/errors'

export const showErrorScreen = (
  error: AppError | Error,
): ThunkAction => dispatch => {
  const appError: AppError =
    error.constructor === AppError
      ? (error as AppError)
      : new AppError(ErrorCode.Unknown, error)

  return dispatch(
    navigationActions.navigate({
      routeName: routeList.Exception,
      params: {
        returnTo: appError.navigateTo,
        error: appError,
      },
    }),
  )
}

export const initApp: ThunkAction = async (
  dispatch,
  getState,
  backendMiddleware,
) => {
  try {
    await backendMiddleware.initStorage()
    const storedSettings = await backendMiddleware.storageLib.get.settingsObject()

    /**
     * @dev Until German and Dutch terms are polished, only English is used.
     * previous code:
     * if (storedSettings.locale) I18n.locale = storedSettings.locale
     * else storedSettings.locale = I18n.locale
     */
    // storedSettings.locale = I18n.locale

    SplashScreen.hide()
    return dispatch(loadSettings(storedSettings))
  } catch (e) {
    return dispatch(
      showErrorScreen(
        new AppError(ErrorCode.WalletInitFailed, e, routeList.Landing),
      ),
    )
  }
}

export const loadSettings = (settings: { [key: string]: any }) => ({
  type: 'LOAD_SETTINGS',
  value: settings,
})

export const setLocale = (locale: string): ThunkAction => async (
  dispatch,
  getState,
  backendMiddleware,
) => {
  // await backendMiddleware.storageLib.store.setting(settingKeys.locale, locale)
  // I18n.locale = locale
  // dispatch({ type: 'SET_LOCALE', value: locale })

  // we need to reset the navigator so that all screens are re-rendered with the
  // new locale
  return dispatch(navigationActions.navigatorReset())
}
