/**
 * This file contains polyfills for various things that are somehow coupled
 * with react-native. This is meant to be used as a polyfill for running the
 * backendMiddleware and redux store under node
 */

import { BackendMiddleware } from './backendMiddleware'
import { createStore, applyMiddleware } from 'redux'
import thunk from 'redux-thunk'
import { rootReducer, RootState } from './reducers'

import originalORMConfig from './ormconfig'
import config from './config'

const ormconfig = {
  ...originalORMConfig,
  // change type to 'sqlite' instead of 'react-native'
  type: 'sqlite',
  database: 'db.sqlite3',
}

export function initStore() {
  const bemwConfig = config
  // @ts-ignore
  bemwConfig.typeOrmConfig = ormconfig

  // instantiate the storage backend
  const backendMiddleware = new BackendMiddleware(bemwConfig)

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
