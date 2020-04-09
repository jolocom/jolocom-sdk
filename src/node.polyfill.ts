/**
 * This file contains polyfills for various things that are somehow coupled
 * with react-native. This is meant to be used as a polyfill for running the
 * backendMiddleware and redux store under node
 */

import { BackendMiddleware } from 'src/backendMiddleware'
import { createStore, applyMiddleware } from 'redux'
import thunk from 'redux-thunk'
import { rootReducer, RootState } from 'src/reducers'

import * as originalORMConfig from 'src/ormconfig'

const ormconfig = {
  ...originalORMConfig,
  // change type to 'sqlite' instead of 'react-native'
  type: 'sqlite',
  database: 'db.sqlite3',
}

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
