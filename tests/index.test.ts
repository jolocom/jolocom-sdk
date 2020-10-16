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
