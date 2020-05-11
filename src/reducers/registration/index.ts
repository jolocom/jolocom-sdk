import { combineReducers } from 'redux'
import { loading } from './loading'

export interface LoadingState {
  readonly loadingMsg: string
  readonly isRegistering: boolean
}

export interface RegistrationState {
  readonly loading: LoadingState
}

export const registrationReducer = combineReducers({
  loading,
})
