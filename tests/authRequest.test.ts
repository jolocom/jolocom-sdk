import { Agent } from '../src'
import { createAgent, destroyAgent, meetAgent } from './util'

const conn1Name = 'auth1'
const conn2Name = 'auth2'
let alice: Agent, bob: Agent

beforeEach(async () => {
  alice = await createAgent(conn1Name, 'jun')
  await alice.createNewIdentity()
  bob = await createAgent(conn2Name, 'jun')
  await bob.createNewIdentity()
})

afterEach(async () => {
  await destroyAgent(conn1Name)
  await destroyAgent(conn2Name)
})

test('Authentication interaction', async () => {
  // making alice resolvable for bob
  await meetAgent(bob, alice, false)

  const aliceAuthRequest = await alice.authRequestToken({
    callbackURL: 'nowhere',
    description: 'test',
  })

  const bobInteraction = await bob.processJWT(aliceAuthRequest)

  const bobResponse = (
    await bobInteraction.createAuthenticationResponse()
  ).encode()
  const bobNewInteraction = await bob.processJWT(bobResponse)

  const aliceInteraction = await alice.processJWT(bobResponse)

  expect(aliceInteraction.getMessages().map(m => m.encode())).toEqual(
    bobNewInteraction.getMessages().map(m => m.encode()),
  )

  await expect(alice.resolve(bob.idw.did)).resolves.toBeTruthy()
  await expect(bob.resolve(alice.idw.did)).resolves.toBeTruthy()
})
