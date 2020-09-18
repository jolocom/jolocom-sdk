import { SDKError, ErrorCode } from './errors'

interface ITransportDesc {
  type: string
}

interface ITransportAPI {
  desc?: ITransportDesc
}

export class Transportable<
  TransportDesc extends ITransportDesc,
  TransportAPI extends ITransportAPI
> {
  private _transportHandlers: {
    [type: string]: (config: any) => TransportAPI
  } = {}

  public registerTransportHandler(
    typeName: string,
    handler: (t: TransportDesc) => TransportAPI,
  ) {
    this._transportHandlers[typeName] = handler
  }

  public async createTransport(
    transport: TransportDesc,
  ): Promise<TransportAPI> {
    const transportHandler = this._transportHandlers[transport.type]
    if (!transportHandler) throw new SDKError(ErrorCode.TransportNotSupported)
    const transportAPI = await transportHandler(transport)
    transportAPI.desc = transport
    return transportAPI
  }
}
