import { AnyAction } from 'redux'
import { reject } from 'ramda'
import { Notification, NotificationFilter } from '../../lib/notifications'

export const SCHEDULE_NOTIFICATION = 'SCHEDULE_NOTIFICATION'
export const REMOVE_NOTIFICATION = 'REMOVE_NOTIFICATION'
export const SET_ACTIVE_NOTIFICATION = 'SET_ACTIVE_NOTIFICATION'
export const CLEAR_NOTIFICATIONS = 'CLEAR_NOTIFICATIONS'
export const SET_ACTIVE_FILTER = 'SET_ACTIVE_FILTER'

export interface NotificationsState {
  queue: Notification[]
  active: Notification | null
  activeExpiryTs?: number
  activeFilter: NotificationFilter
}

const initialState: NotificationsState = {
  queue: [],
  active: null,
  activeExpiryTs: 0,
  activeFilter: NotificationFilter.all,
}

export const notificationsReducer = (
  state = initialState,
  action: AnyAction,
): NotificationsState => {
  switch (action.type) {
    case SCHEDULE_NOTIFICATION:
      return { ...state, queue: [...state.queue, action.notification] }
    case REMOVE_NOTIFICATION:
      const queue = reject(
        notification => notification.id === action.notification.id,
        state.queue,
      )
      return {
        ...state,
        queue,
      }
    case SET_ACTIVE_NOTIFICATION:
      return {
        ...state,
        active: action.notification,
        activeExpiryTs: action.expiry,
      }
    case CLEAR_NOTIFICATIONS:
      return initialState
    case SET_ACTIVE_FILTER:
      if (state.activeFilter === action.value) return state
      return {
        ...state,
        activeFilter: action.value,
      }
    default:
      return state
  }
}
