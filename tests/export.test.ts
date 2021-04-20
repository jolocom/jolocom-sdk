import { destroyAgent, createAgent, meetAgent, basicCredOffer } from './util'
import { Agent } from '../src'

const conn1Name = 'agentTest1'
const conn2Name = 'agentTest2'

let alice: Agent, bob: Agent
beforeEach(async () => {
  alice = await createAgent(conn1Name)
  await alice.createNewIdentity()

  bob = await createAgent(conn2Name)
  await bob.createNewIdentity()

  await meetAgent(alice, bob)
})

afterEach(async () => {
  await destroyAgent(conn1Name)
  await destroyAgent(conn2Name)
})


describe('Agent export/import', () => {
  test("basics", async () => {
    let creds = [{ type: 'dummy' }, { type: 'anotherdummy' }]
    await basicCredOffer(alice, bob, creds)

    const bobsCreds = await bob.credentials.query()
    const bobsCredDisplays = await Promise.all(
      bobsCreds.map(cred => bob.credentials.display(cred))
    )
    const exportedBob = await bob.export()

    await expect(
      bob.interactionManager.listInteractions()
    ).resolves.toHaveLength(1)

    await bob.deleteIdentityData()
    await expect(
      bob.sdk.storage.get.identity(bob.idw.did),
    ).resolves.toBeUndefined()

    const newBob = await alice.sdk.importAgent(exportedBob)
    expect(newBob.idw.did).toEqual(bob.idw.did)
    const newBobsCreds = await newBob.credentials.query()
    await expect(newBobsCreds).toEqual(bobsCreds)
    await expect(
      Promise.all(newBobsCreds.map(cred => newBob.credentials.display(cred)))
    ).resolves.toEqual(bobsCredDisplays)

    await expect(
      newBob.interactionManager.listInteractions()
    ).resolves.toHaveLength(1)
  })
})
