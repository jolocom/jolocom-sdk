import WebSocket from 'ws'
import { Agent, ChannelTransportType } from '../src'
import { createAgent, destroyAgent, meetAgent } from './util'
import { EstablishChannelRequest } from '../src/interactionManager/types'
import { Channel } from '../src/channels'

/*
 * Create an EstablishChannel interaction
 *
 *
 *
 * interxn = new Interaction(interactionManager, transportAPI, id, interactionType)
 *
 *
 * interxn.respond
 *
 *
 *
 *
 */

const conn1Name = 'user'
const conn2Name = 'service'
const testPort = 8888

let user: Agent, service: Agent
let wss: WebSocket.Server

const testWsEndpoint = `ws://127.0.0.1:${testPort}`

let serviceChanPromise: Promise<Channel>

beforeEach(async () => {
  // Create a user Agent and configure WebSockets transport handler
  user = await createAgent(conn1Name)
  user.sdk.transports.ws.configure({ WebSocket })
  await user.createNewIdentity()

  // Create a service agent, and start a WebSockets server
  service = await createAgent(conn2Name)
  await service.createNewIdentity()
  let setServiceChan: (ch: Channel) => void
  serviceChanPromise = new Promise<Channel>(resolve => {
    setServiceChan = resolve
  })
  wss = new WebSocket.Server({ port: testPort })
  wss.on('connection', ws => {
    let ch: Channel | null = null
    ws.addEventListener('message', async ev => {
      const message = ev.data
      try {
        if (!ch) {
          const interxn = await service.processJWT(message)
          ch = await service.channels.create(interxn, {
            send: async (msg) => ws.send(msg)
          })
          setServiceChan(ch)
        } else {
          await ch.processJWT(message)
        }
      } catch (err) {
        console.log('processJWT error', err, 'while processing', message)
      }
    });
  });

  // Make agents encounter each other
  await meetAgent(user, service, false)

  console.log('user is', user.identityWallet.did)
  console.log('service is', service.identityWallet.did)
})

afterEach(async () => {
  await destroyAgent(conn1Name)
  await destroyAgent(conn2Name)
  wss.close()
})

test('Establish a channel', async () => {
  // Create an EstablishChannelRequest and go through the flow
  const req: EstablishChannelRequest = {
    description: "Test Channel",
    transports: [
      {
        type: ChannelTransportType.WebSockets,
        config: testWsEndpoint
      }
    ]
  }
  const reqToken = await service.establishChannelRequestToken(req)

  const userInterxn = await user.processJWT(reqToken)
  const userResp = await userInterxn.createEstablishChannelResponse(0)
  await userInterxn.processInteractionToken(userResp)

  const userChan = await user.channels.create(userInterxn)
  await userChan.start(async interxn => {
    console.log('use got interaction request', interxn.id)
    const resp = await interxn.createAuthenticationResponse()
    await interxn.send(resp)
  })
  await userChan.send(userResp)

  const serviceChan = await serviceChanPromise
  const authReq = await service.authRequestToken({
    callbackURL: '',
    description: "test"
  })
  const resp = await serviceChan.startThread(authReq)
  const interxn = await service.findInteraction(resp)
  const userAuthInterxn = await user.findInteraction(resp)
  expect(interxn!.flow.state).toEqual(userAuthInterxn!.flow.state)
})
