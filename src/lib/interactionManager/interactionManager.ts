import { JolocomSDK, JolocomLib } from 'index'
import { JSONWebToken } from 'jolocom-lib/js/interactionTokens/JSONWebToken'
import { Interaction } from './interaction'
import { InteractionTransportType } from './types'
import { Transportable } from '../transports'
import { AppError, ErrorCode } from '../errors'

export interface InteractionTransport {
  type: InteractionTransportType
  callbackURL: string
}

export interface InteractionTransportAPI {
  send: (jwt: JSONWebToken<any>) => Promise<any>
  receive?: () => Promise<JSONWebToken<any>>
  ready?: Promise<void>
  desc?: InteractionTransport
}

// TODO move out to environment specific plugins
const httpTransport = {
  type: InteractionTransportType.HTTP,
  handler(config: InteractionTransport) {
    const { callbackURL } = config
    return {
      send: async (token: JSONWebToken<any>) => {
        const response = await fetch(callbackURL, {
          method: 'POST',
          body: JSON.stringify({ token: token.encode() }),
          headers: { 'Content-Type': 'application/json' },
        })

        if (!response.ok) {
          // TODO Error code for failed send?
          // TODO Actually include some info about the error
          throw new AppError(ErrorCode.Unknown)
        }

        const text = await response.text()

        if (text.length) {
          const { token } = JSON.parse(text)
          return JolocomLib.parse.interactionToken.fromJWT(token)
        }
        return
      },
    }
  },
}

/***
 * - initiated inside BackendMiddleware
 * - has access to identityWallet / registry ?? (or should be inside Interaction)
 * - holds a map of all interactions:
 *    - {nonce: token or interaction instance} ??
 * - can start / end an interaction
 *
 */

export class InteractionManager extends Transportable<
  InteractionTransport,
  InteractionTransportAPI
> {
  public readonly ctx: JolocomSDK

  public interactions: {
    [NONCE: string]: Interaction
  } = {}

  public constructor(ctx: JolocomSDK) {
    super()
    this.ctx = ctx
    // TODO move this out to an environemnt specific plugin
    this.registerTransportHandler(
      InteractionTransportType.HTTP,
      httpTransport.handler,
    )
  }

  public async start<T>(
    transportType: InteractionTransportType,
    token: JSONWebToken<T>,
  ) {
    // @ts-ignore - CredentialReceive has no callbackURL, needs fix on the lib for JWTEncodable.
    const { callbackURL } = token.interactionToken
    const transportConfig: InteractionTransport = {
      type: transportType,
      callbackURL,
    }

    if (!transportConfig) throw new Error('no transport coniguration!')
    const transportAPI = await this.createTransport(transportConfig)
    const interaction = new Interaction(
      this,
      transportAPI,
      token.nonce,
      token.interactionType,
    )
    await interaction.processInteractionToken(token)

    this.interactions[token.nonce] = interaction
    return interaction
  }

  // FIXME this can return UNDEFINED, should throw an error
  // FIXME need to be async to support storage backends
  public getInteraction(id: string) {
    return this.interactions[id]
  }
}
