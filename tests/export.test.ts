import { claimsMetadata } from '@jolocom/protocol-ts'
import { destroyAgent, createAgent, meetAgent, basicCredOffer } from './util'
import { Agent } from '../src'
import { SignedCredential } from 'jolocom-lib/js/credentials/signedCredential/signedCredential'

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


const credSorter = (c1: SignedCredential, c2: SignedCredential) => {
  if (c1.id < c2.id) {
    return -1
  } else if (c1.id > c2.id) {
    return 1
  } else {
    return 0
  }
}

describe('Agent export/import', () => {
  test("basics", async () => {
    let creds = [{ type: 'dummy' }, { type: 'anotherdummy' }]
    await basicCredOffer(alice, bob, creds)
    await bob.credentials.issue({
      metadata: claimsMetadata.name,
      claim: {
        givenName: 'bob',
        familyName: 'alsobob'
      },
      subject: bob.idw.did
    })

    const bobsCreds = await bob.credentials.query()
    bobsCreds.sort(credSorter)
    const bobsCredDisplays = await Promise.all(
      bobsCreds.map(cred => bob.credentials.display(cred))
    )
    const exportedBob = await bob.export()

    await expect(
      bob.interactionManager.listInteractions()
    ).resolves.toHaveLength(1)

    await bob.delete()
    await expect(
      bob.sdk.storage.get.identity(bob.idw.did),
    ).resolves.toBeUndefined()

    const newBob = await alice.sdk.importAgent(exportedBob)
    expect(newBob.idw.did).toEqual(bob.idw.did)
    const newBobsCreds = await newBob.credentials.query()
    newBobsCreds.sort(credSorter)
    await expect(newBobsCreds.length).toEqual(bobsCreds.length)
    await expect(newBobsCreds).toEqual(bobsCreds)
    await expect(
      Promise.all(newBobsCreds.map(cred => newBob.credentials.display(cred)))
    ).resolves.toEqual(bobsCredDisplays)

    await expect(
      newBob.interactionManager.listInteractions()
    ).resolves.toHaveLength(1)
  })
})
