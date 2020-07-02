import { Identity } from 'jolocom-lib/js/identity/identity'
import { Interaction } from './interaction'
import { Keeper } from './keeper'

interface WebSocketsSession {
  remoteIdentity: Identity
  initInteraction: Interaction
  ws: WebSocket
}

export class WebSocketsKeeper extends Keeper<string, WebSocketsSession> {
}
