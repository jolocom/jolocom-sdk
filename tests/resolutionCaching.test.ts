import { Agent } from '../src'
import { createAgent, destroyAgent } from './util'

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

test('Resolved identity should be cached after succesfull resolution', async () => {
  const testDID = 'did:jolo:36a04e7d50c1175281b869d891ea9231351f7585a2a71395faeb4fafff1dcc78'
  const cachedIdentity = await alice.storage.get.identity(testDID)

  expect(cachedIdentity).toBeUndefined
  const resolvedIdentity = await alice.resolve(testDID)
  expect(await alice.storage.get.identity(testDID)).toStrictEqual(resolvedIdentity)
})
