import { JolocomSDK } from '../'
import { createAgent, destroyAgent, meetAgent } from './util'

const conn1Name = 'auth1'
const conn2Name = 'auth2'
let alice: JolocomSDK, bob: JolocomSDK

beforeEach(async () => {
  alice = await createAgent(conn1Name)
  alice.setDefaultDidMethod('jun')
  await alice.createNewIdentity()

  bob = await createAgent(conn2Name)
  bob.setDefaultDidMethod('jun')
  await bob.createNewIdentity()
})

afterEach(async () => {
  await destroyAgent(conn1Name)
  await destroyAgent(conn2Name)
})

test('Authentication interaction', async () => {
  // making them mutually resolvable
  await meetAgent(alice, bob)
  await meetAgent(bob, alice)

  const aliceAuthRequest = await alice.authRequestToken({
    callbackURL: 'nowhere',
    description: 'test',
  })

  const bobInteraction = await bob.processJWT(aliceAuthRequest)

  const bobResponse = (
    await bobInteraction.createAuthenticationResponse()
  ).encode()
  await bob.processJWT(bobResponse)

  const aliceInteraction = await alice.processJWT(bobResponse)

  expect(aliceInteraction.getMessages().map(m => m.encode())).toEqual(
    bobInteraction.getMessages().map(m => m.encode()),
  )
})
