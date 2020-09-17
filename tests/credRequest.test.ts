import { claimsMetadata } from 'jolocom-lib'
import { JolocomSDK } from '../'
import { createAgent, destroyAgent, meetAgent } from './util'

const conn1Name = 'share1'
const conn2Name = 'share2'

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

test('Credential Request interaction', async () => {
  // making them mutually resolvable
  await meetAgent(alice, bob)
  await meetAgent(bob, alice)

  // ensure bob is resolvable by alice
  await expect(alice.resolve(bob.idw.did)).resolves.toMatchObject(
    Promise.resolve(bob.idw.didDocument.toJSON()),
  )

  // ensure alice is resolvable by bob
  await expect(bob.resolve(alice.idw.did)).resolves.toMatchObject(
    Promise.resolve(alice.idw.didDocument.toJSON()),
  )

  // Bob self-issues a name credential
  const bobSelfSignedCred = await bob.signedCredential({
    metadata: claimsMetadata.name,
    subject: bob.idw.did,
    claim: {
      givenName: 'Bob',
      familyName: 'Agent',
    },
  })

  await bob.storageLib.store.verifiableCredential(bobSelfSignedCred)

  const aliceCredReq = await alice.credRequestToken({
    callbackURL: 'nowhere',
    credentialRequirements: [
      { type: ['ProofOfNameCredential'], constraints: [] },
    ],
  })

  const bobInteraction = await bob.processJWT(aliceCredReq)

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
