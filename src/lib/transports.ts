import { AppError, ErrorCode } from './errors'

interface ITransportDesc {
  type: string
}

export class Transportable<TransportDesc extends ITransportDesc, TransportAPI> {
  private _transportHandlers: {
    [type: string]: (config: any) => TransportAPI
  } = {}

  public registerTransportHandler(typeName: string, handler: (t: TransportDesc) => TransportAPI) {
    this._transportHandlers[typeName] = handler
  }

  public async createTransport(transport: TransportDesc): Promise<TransportAPI> {
    const transportHandler = this._transportHandlers[transport.type]
    if (!transportHandler) throw new AppError(ErrorCode.TransportNotSupported)
    return transportHandler(transport)
  }
}
