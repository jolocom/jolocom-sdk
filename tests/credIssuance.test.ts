import {
  createConnection,
  getConnection,
  Connection,
  ConnectionOptions,
} from 'typeorm'
import { JolocomTypeormStorage } from '@jolocom/sdk-storage-typeorm'
import { claimsMetadata } from 'jolocom-lib'
import { InternalDb } from '@jolocom/local-resolver-registrar/js/db'
import { JolocomSDK, NaivePasswordStore } from '../'
import { getConnectionConfig } from './util'

const conn1Name = 'issuance1'
const conn2Name = 'issuance2'

const testConnection1 = getConnectionConfig(conn1Name) as ConnectionOptions
const testConnection2 = getConnectionConfig(conn2Name) as ConnectionOptions

const getSdk = (connection: Connection, eDB?: InternalDb) =>
  new JolocomSDK({
    passwordStore: new NaivePasswordStore(),
    storage: new JolocomTypeormStorage(connection),
    eventDB: eDB,
  })

beforeEach(async () => {
  await createConnection(testConnection1)
  await createConnection(testConnection2)
})

afterEach(async () => {
  const conn1 = getConnection(conn1Name)
  await conn1.close()
  const conn2 = getConnection(conn2Name)
  return conn2.close()
})

test('Credential Issuance interaction', async () => {
  const aliceCon = getConnection(conn1Name)
  const bobCon = getConnection(conn2Name)

  const alice = getSdk(aliceCon)
  alice.setDefaultDidMethod('jun')
  await alice.init()

  const bob = getSdk(bobCon)
  bob.setDefaultDidMethod('jun')
  await bob.createNewIdentity()

  // making them mutually resolvable
  const aliceId = alice.idw.did.split(':')[2]
  const aliceEL = await alice.storageLib.eventDB.read(aliceId)

  const bobId = bob.idw.did.split(':')[2]
  const bobEL = await bob.storageLib.eventDB.read(bobId)

  await alice.didMethods.getDefault().registrar.encounter(bobEL)
  await bob.didMethods.getDefault().registrar.encounter(aliceEL)

  // ensure bob is resolvable by alice
  await expect(alice.resolve(bob.idw.did)).resolves.toMatchObject(
    Promise.resolve(bob.idw.didDocument.toJSON()),
  )

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
