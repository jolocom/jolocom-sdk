import { SDKError, ErrorCode } from './errors'
import { TransportHandler, TransportDesc, TransportMessageHandler, TransportAPI, InteractionTransportType } from './types'

export interface FetchResponse {
  text: () => Promise<string>
  ok: boolean
  status: string
}
export type Fetch = (
  url: string,
  config?: {
    method: 'GET' | 'POST',
    body: string,
    headers: {
      'Content-Type'?: string
    }
  }
) => Promise<FetchResponse>

const throwFetchNotConfigured = async () => {
  throw new Error('sdk.transports.http is not configured')
}

export class HTTPTransport implements TransportHandler {
  type = InteractionTransportType.HTTP
  private _fetch: Fetch = throwFetchNotConfigured

  configure({ fetch }: { fetch: Fetch }) {
    this._fetch = fetch
  }

  start(desc: TransportDesc, onMessage?: TransportMessageHandler): TransportAPI {
    const { config: callbackURL } = desc
    return {
      send: async (token: string) => {
        const response = await this._fetch(callbackURL, {
          method: 'POST',
          body: JSON.stringify({ token }),
          headers: { 'Content-Type': 'application/json' },
        })

        const text = await response.text()

        if (!response.ok) {
          // TODO Error code for failed send?
          // TODO Actually include some info about the error
          throw new SDKError(ErrorCode.Unknown, new Error(text))
        }

        if (text.length) {
          let token
          try {
            token = JSON.parse(text).token
          } catch (err) {
          }
          if (!onMessage || !token) {
            throw new SDKError(
              ErrorCode.Unknown, new Error(text)
            )
          }
          await onMessage(token)
        }
      },
    }
  }
}
