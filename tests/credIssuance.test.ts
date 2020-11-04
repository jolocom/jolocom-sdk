import { claimsMetadata } from 'jolocom-lib'
import { Agent } from '../src'
import { destroyAgent, createAgent, meetAgent } from './util'

const conn1Name = 'issuance1'
const conn2Name = 'issuance2'

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

test('Credential Issuance interaction', async () => {
  // making alice resolvable by bob
  await meetAgent(bob, alice, false)

  // ensure alice is resolvable by bob
  await expect(bob.resolve(alice.idw.did)).resolves.toMatchObject(
    Promise.resolve(alice.idw.didDocument.toJSON()),
  )

  const aliceCredOffer = await alice.credOfferToken({
    callbackURL: 'nowhere',
    offeredCredentials: [
      {
        type: claimsMetadata.name.type[1],
      },
    ],
  })

  const bobInteraction = await bob.processJWT(aliceCredOffer)

  const bobResponse = (
    await bobInteraction.createCredentialOfferResponseToken([
      { type: claimsMetadata.name.type[1] },
    ])
  ).encode()
  await bob.processJWT(bobResponse)

  const aliceInteraction = await alice.processJWT(bobResponse)

  const aliceIssuance = await aliceInteraction.createCredentialReceiveToken([
    await alice.signedCredential({
      metadata: claimsMetadata.name,
      subject: bob.idw.did,
      claim: {
        givenName: 'Bob',
        familyName: 'Agent',
      },
    }),
  ])

  const bobRecieving = await bob.processJWT(aliceIssuance.encode())

  // @ts-ignore
  expect(bobRecieving.getSummary().state.credentialsAllValid).toBeTruthy()
})
