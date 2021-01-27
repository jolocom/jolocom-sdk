export { FilePasswordStore } from '@jolocom/sdk-password-store-filesystem'
import { destroyAgent, getSdk } from './util'
import { JolocomSDK } from 'src'

const connName = 'test'

let sdk: JolocomSDK
beforeEach(async () => {
  sdk = await getSdk(connName)
  sdk.setDefaultDidMethod('jun')
})

afterEach(async () => {
  await destroyAgent(connName)
})

test('Create Agent', async () => {
  const alice = await sdk.createAgent('pass', 'jun')
  expect(alice.idw.did).toBeDefined()
})

test('Init Agent with only a password', async () => {
  const alice = await sdk.initAgent({ password: 'please' })
  expect(alice.idw.did).toBeDefined()
})

test('Init Agent with only a password store', async () => {
  const passwordStore = new FilePasswordStore(__dirname + '/password.txt')
  const alice = await sdk.initAgent({ passwordStore })
  expect(alice.idw.did).toBeDefined()
})

test('Init Agent multiple times returning the same agent', async () => {
  const alice = await sdk.initAgent({ password: 'please' })
  expect(alice.idw.did).toBeDefined()

  const aliceAgain = await sdk.initAgent({ password: 'please' })

  expect(alice.idw.did).toEqual(aliceAgain.idw.did)
})

test('Allow agents on the same DB to interact together', async () => {
  // NOTE: both agents are created on the same SDK instance, hence the same
  // storage backend connection
  const alice = await sdk.initAgent({ password: 'please' })
  const bob = await sdk.createAgent('pass', 'jun')
  const authReq = await alice.authRequestToken({
    callbackURL: '',
    description: 'hello neighbour'
  })
  const bobInterxn = await bob.processJWT(authReq.encode())
  const authResp = await bobInterxn.createAuthenticationResponse()
  await alice.processJWT(authResp.encode())
  await bob.processJWT(authResp.encode())
})

test('Allow interaction continuation accross agent instances which share a DID', async () => {
  // NOTE: both agents are created on the same SDK instance, hence the same
  // storage backend connection, hence they have access to the
  const alice = await sdk.initAgent({ password: 'please' })
  const bob = await sdk.createAgent('pass', 'jun')

  const auth = await alice.credOfferToken({
    callbackURL: 'none',
    offeredCredentials: [{ type: 'dummy' }],
  })

  const bobInteraction = await bob.processJWT(auth.encode())

  const res = await bobInteraction
    .createCredentialOfferResponseToken([{ type: 'dummy' }])

  const alice2 = await sdk.initAgent({ password: 'please' })

  const continuedInteraction = await alice2.processJWT(res.encode())

  // @ts-ignore
  expect(continuedInteraction.getSummary().state.offerSummary).toEqual([
    { type: 'dummy' },
  ])

  // @ts-ignore
  expect(continuedInteraction.getSummary().state.selection).toEqual([
    { type: 'dummy' },
  ])
})
