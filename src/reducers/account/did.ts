import { AnyAction } from 'redux'
import { DidState } from './index'

const initialState: DidState = {
  did: '',
}

export const did = (state = initialState, action: AnyAction): DidState => {
  switch (action.type) {
    case 'DID_SET':
      return {
        did: action.value,
      }
    default:
      return state
  }
}
