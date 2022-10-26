import { claimsMetadata } from 'jolocom-lib'
import { Agent } from '../src'
import { createAgent, destroyAgent, meetAgent } from './util'
import {CredentialRequestFlowState} from '../js/interactionManager/types'

const conn1Name = 'share1'
const conn2Name = 'share2'

let alice: Agent, bob: Agent

beforeEach(async () => {
  alice = await createAgent(conn1Name)
  await alice.createNewIdentity()

  bob = await createAgent(conn2Name)
  await bob.createNewIdentity()
})

afterEach(async () => {
  await destroyAgent(conn1Name)
  await destroyAgent(conn2Name)
})

test('Credential Request interaction', async () => {
  // making alice resolvable by bob
  await meetAgent(bob, alice, false)

  // ensure alice is resolvable by bob
  await expect(bob.resolve(alice.idw.did)).resolves.toMatchObject(
    Promise.resolve(alice.idw.didDocument.toJSON()),
  )

  // Bob self-issues a name credential
  const bobSelfSignedCred = await bob.credentials.create({
    metadata: claimsMetadata.name,
    subject: bob.idw.did,
    claim: {
      givenName: 'Bob',
      familyName: 'Agent',
    },
  })

  const aliceCredReq = await alice.credRequestToken({
    callbackURL: 'nowhere',
    credentialRequirements: [
      { type: ['ProofOfNameCredential'], constraints: [] },
    ],
  })

  const bobInteraction = await bob.processJWT(aliceCredReq.encode())
  expect(() => bobInteraction.transportAPI).not.toThrow()

  const bobResponse = (
    await bobInteraction.createCredentialResponse([bobSelfSignedCred.id])
  ).encode()
  await bob.processJWT(bobResponse)

  const aliceInteraction = await alice.processJWT(bobResponse)

  expect(
    // @ts-ignore
    aliceInteraction.getSummary().state.providedCredentials[0]
      .suppliedCredentials,
  ).toHaveLength(1)
})

test('Invalid Credential Response should be rejected', async () => {
  // making alice resolvable by bob
  await meetAgent(bob, alice, false)

  // ensure alice is resolvable by bob
  await expect(bob.resolve(alice.idw.did)).resolves.toMatchObject(
    Promise.resolve(alice.idw.didDocument.toJSON()),
  )

  // Bob self-issues a name credential
  const bobSelfSignedCred = await bob.credentials.create({
    metadata: claimsMetadata.name,
    subject: bob.idw.did,
    claim: {
      givenName: 'Bob',
      familyName: 'Agent',
    },
    expires: new Date(Date.now() + 10),
  })

  //wait for credential to expire
  await new Promise((resolve) => setTimeout(resolve, 1000))

  const aliceCredReq = await alice.credRequestToken({
    callbackURL: 'nowhere',
    credentialRequirements: [
      { type: ['ProofOfNameCredential'], constraints: [] },
    ],
  })

  const bobInteraction = await bob.processJWT(aliceCredReq.encode())
  expect(() => bobInteraction.transportAPI).not.toThrow()

  const bobResponse = (
    await bobInteraction.createCredentialResponse([bobSelfSignedCred.id])
  ).encode()

  await expect(bob.processJWT(bobResponse)).rejects.toThrow()

  await expect(alice.processJWT(bobResponse)).rejects.toThrow()

  const aliceInteraction = await alice.findInteraction(aliceCredReq.nonce)
  const state = aliceInteraction.getSummary().state as CredentialRequestFlowState


  expect(
    state.validityMap
  ).toHaveLength(1)

  expect(
    state.validityMap[0].expired
  ).toEqual(true)
})
