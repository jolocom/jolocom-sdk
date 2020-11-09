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

test('Init Agent multiple times returning the same agent', async () => {
  const alice = await sdk.initAgent({ password: 'please' })
  expect(alice.idw.did).toBeDefined()

  const aliceAgain = await sdk.initAgent({ password: 'please' })

  expect(alice.idw.did).toEqual(aliceAgain.idw.did)
})

test('Allow interaction continuation accross agent instances which share a DID', async () => {
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
