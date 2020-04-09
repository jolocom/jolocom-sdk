/**
 * This file contains polyfills for various things that are somehow coupled
 * with react-native. This is meant to be used as a polyfill for running the
 * backendMiddleware and redux store under node
 */

function logCall(pref: string) {
  return (msg: string) => console.log(`${pref}: ${msg}`)
}

import { BackendMiddleware } from 'src/backendMiddleware'
import { createStore, applyMiddleware } from 'redux'
import thunk from 'redux-thunk'
import { rootReducer, RootState } from 'src/reducers'

const ormconfig = require('../ormconfig.ts').default

// change type to 'sqlite' instead of 'react-native'
ormconfig.type = 'sqlite'
ormconfig.database = 'db.sqlite3'

export function initStore() {
  const config = require('src/config.ts')
  config.typeOrmConfig = ormconfig

  // instantiate the storage backend
  const backendMiddleware = new BackendMiddleware(config)

  const store = {
    ...createStore(
      rootReducer,
      {} as RootState,
      applyMiddleware(thunk.withExtraArgument(backendMiddleware)),
    ),
    backendMiddleware,
  }

  return store
}

export {
  IpfsStorageAgent as IpfsCustomConnector,
} from 'node_modules/jolocom-lib/js/ipfs/ipfs'

// default export merge of all default exports
export default {
  // src/locales/i18n.ts default export
  t: (str: string) => str,

  // react-native-splash-screen
  hide: () => logCall('SplashScreen')('hide'),
}

import { randomBytes } from 'crypto'
export const NativeModules = { RNRandomBytes: { randomBytes } }

export class Linking {
  static async canOpenURL(url: string) {
    console.log('canOpenURL called with ' + url)
    return true
  }

  static async openURL(url: string) {
    console.log('openURL called with ' + url)
  }
}
