import { InteractionSummary, FlowType, EstablishChannelFlowState } from '../interactionManager/types'
import { JSONWebToken } from 'jolocom-lib/js/interactionTokens/JSONWebToken'
import { Interaction } from '../interactionManager/interaction'
import { ChannelTransportAPI, ChannelKeeper } from './channelKeeper'
import { JolocomLib } from 'jolocom-lib'

export interface ChannelSummary {
  initialInteraction: InteractionSummary
  interactions: InteractionSummary[]
}

interface ChannelQuery {
  promise: Promise<JSONWebToken<any>>
  resolve?: (resp: JSONWebToken<any>) => void
  reject?: (err?: Error) => void
  sendResult?: any
  response?: JSONWebToken<any>
}

export class Channel {
  public ctx: ChannelKeeper
  public id: string
  public initialInteraction: Interaction
  public authPromise: Promise<boolean>
  private _threads: {[id: string]: ChannelQuery} = {}
  private _threadIdList: string[] = []
  private _transportAPI?: ChannelTransportAPI
  private _started = false
  private _startedPromise: Promise<void> | null = null
  private _resolveAuthPromise!: (value?: boolean) => void

  public constructor(
    ctx: ChannelKeeper,
    initialInteraction: Interaction,
    transportAPI?: ChannelTransportAPI
  ) {
    this.ctx = ctx
    this.id = initialInteraction.id
    this.initialInteraction = initialInteraction
    this._transportAPI = transportAPI

    this.authPromise = new Promise<boolean>(resolve => {
      this._resolveAuthPromise = resolve
    })

    // TODO for a "server" side, the interaction will not yet have a response
    //      and the server should wait till a response is received before
    //      setting it as authenticated
  }

  get counterparty() {
    return this.initialInteraction.counterparty
  }

  get authenticated() {
    const flowState = this.initialInteraction.flow.getState() as EstablishChannelFlowState
    return flowState.established
  }

  public getSummary(): ChannelSummary {
    const interactions = this._threadIdList.map((qId: string) => {
      const interxn = this.ctx.ctx.interactionManager.getInteraction(qId)
      return interxn && interxn.getSummary()
    })

    return {
      initialInteraction: this.initialInteraction.getSummary(),
      interactions
    }
  }

  get transportAPI() {
    if (!this._transportAPI) throw new Error('no channel transport')
    return this._transportAPI
  }

  set transportAPI(api: ChannelTransportAPI) {
    this._transportAPI = api
  }

  public send(msg: string) {
    return this.transportAPI.send(msg)
  }

  public async processJWT(jwt: string) {
    const interxn = await this.ctx.ctx.processJWT(jwt)
    if (interxn.id === this.id) {
      // this is the channel establishment response, update if necessary
      this.initialInteraction = interxn
      // TODO check if response valid?

      if (this.authenticated) this._resolveAuthPromise(true)
    }

    // TODO ~ @mnzaki
    // this is currently hardcoded to handle certain kinds of requests
    // the long term plan is to ask the App API "what next" and provide response
    // options
    //
    // the short term plan is to candycrush the `Interaction.create*Response()`
    // methods and have a simple `respond()` method that "just works" when there
    // are no inputs (arguments) needed
    //
    // const resp = await interxn.getOrCreateResponse()


    // TODO
    // some form of simple permission system so that the user knows what they
    // are consenting to when they open a channel

    this._ensureAuthenticated()
    let resp
    if (interxn.flow.type === FlowType.Authentication) {
      resp = await interxn.createAuthenticationResponse()
    }

    if (resp) {
      this.send(resp.encode())
    }

    // const token = JolocomLib.parse.interactionToken.fromJWT(jwt)
    //const qId = token.nonce
    //const query = this._threads[qId]
    //query.response = token
    //query.resolve && query.resolve(token)

    return interxn
  }

  private _ensureAuthenticated() {
    if (!this.authenticated) {
      throw new Error('not authenticated') // FIXME new errcode ChannelNotAuthenticated
    }
  }

  public async start() {
    this._ensureAuthenticated()

    if (!this._started) {
      this._started = true
      this._startedPromise = new Promise(async (resolve) => {
        while (this._started) {
          const msg = await this.transportAPI.receive()
          this.processJWT(msg)
        }
        resolve()
      })
    }

    return this._startedPromise
  }

  public stop() {
    if (!this._started) return

    this.transportAPI.stop()
    this._started = false
  }

  public async sendQuery<T>(token: JSONWebToken<T>) {
    const qId = token.nonce
    const query: ChannelQuery = this._threads[qId] = {
      promise: new Promise((resolve, reject) => {
        query.resolve = resolve
        query.reject = reject
        return this.send(token.encode())
      })
    }

    this._threadIdList.push(qId)

    // TODO add expiry mechanism to reject and delete query from memory once tokens expire

    return query.promise
  }
}
