import { combineReducers } from 'redux'
import { settingsReducer, SettingsState } from './settings/'
import { accountReducer, AccountState } from './account/'
import { registrationReducer, RegistrationState } from './registration/'
import { documentsReducer, DocumentsState } from './documents'
import { notificationsReducer, NotificationsState } from './notifications'

export const rootReducer = combineReducers<RootState>({
  settings: settingsReducer,
  account: accountReducer,
  registration: registrationReducer,
  documents: documentsReducer,
  notifications: notificationsReducer,
})

export interface RootState {
  readonly settings: SettingsState
  readonly account: AccountState
  readonly registration: RegistrationState
  readonly documents: DocumentsState
  readonly notifications: NotificationsState
}
