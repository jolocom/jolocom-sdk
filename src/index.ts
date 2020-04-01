import { initStore } from 'src/node.polyfill'
import * as entities from 'src/lib/storage/entities'
import * as actions from 'src/actions'

export { initStore, entities, actions }

export class JolocomSDK {
  store: ReturnType<typeof initStore>

  constructor(store: ReturnType<typeof initStore>) {
    this.store = store
  }
}
