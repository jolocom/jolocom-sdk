import { SDKError, ErrorCode } from './errors'
import { HTTPTransport } from './http'
import { TransportHandler, TransportDesc, TransportMessageHandler, TransportAPI } from './types'
import { WebSocketsTransport } from './websocket'

export class Transportable {
  protected _transportAPI?: TransportAPI

  constructor(transportAPI?: TransportAPI) {
    this._transportAPI = transportAPI
  }

  get transportAPI() {
    if (!this._transportAPI) throw new Error('no transport')
    return this._transportAPI
  }

  set transportAPI(api: TransportAPI) {
    this._transportAPI = api
  }

}

export class TransportKeeper {
  private _transportHandlers: {
    [type: string]: TransportHandler
  }

  http = new HTTPTransport()
  ws = new WebSocketsTransport()

  constructor() {
    this._transportHandlers = {
      [this.http.type]: this.http,
      [this.ws.type]: this.ws,
    }
  }

  public register(
    typeName: string,
    handler: TransportHandler
  ) {
    this._transportHandlers[typeName] = handler
  }

  /**
   * Start a transport given a {@link TransportDesc} and a
   * {@link TransportMessageHandler}.
   */
  public async start(
    transport: TransportDesc,
    onMessage?: TransportMessageHandler
  ): Promise<TransportAPI> {
    const transportHandler = this._transportHandlers[transport.type]
    if (!transportHandler) throw new SDKError(ErrorCode.TransportNotSupported)
    const transportAPI = await transportHandler.start(transport, onMessage)
    transportAPI.desc = transport
    return transportAPI
  }
}
