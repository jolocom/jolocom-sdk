import { TransportDesc, TransportMessageHandler, TransportAPI, ChannelTransportType } from '.'

type WebSocketEventName = 'open' | 'close' | 'error' | 'message'

interface WebSocket {
  new(url: string): WebSocket
  addEventListener(name: WebSocketEventName, handler: (ev: any) => void): void
  send(data: string): void
  close(): void
}

export class WebSocketsTransport {
  type = ChannelTransportType.WebSockets

  private _WS!: WebSocket

  configure({ WebSocket }: { WebSocket: WebSocket }) {
    this._WS = WebSocket
  }

  start(desc: TransportDesc, onMessage?: TransportMessageHandler): TransportAPI {
    if (!this._WS) throw new Error('sdk.transports.ws is not configured')
    const ws = new this._WS(desc.config)
    const readyPromise = new Promise<void>((resolve, reject) => {
      let ready = false

      ws.addEventListener('error', (ev) => {
        if (!ready) reject(ev)
      })

      // TODO check for open errors and reject the promise
      ws.addEventListener('open', (ev) => {
        ready = true
        resolve()
      });

      ws.addEventListener('close', () => {
        // TODO check for close errors and reject the promise
      })

      ws.addEventListener('message', async (message) => {
        onMessage && onMessage(message.data)
      })
    })

    return {
      // NOTE FIXME should send JSON.stringify??
      send: async (msg) => {
        console.log('sending mdessss', msg)
        ws.send(msg)
      },
      ready: readyPromise,
      stop: () => ws.close()
    }
  }
}
