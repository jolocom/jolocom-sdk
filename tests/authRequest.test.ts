import {
  createConnection,
  getConnection,
  Connection,
  ConnectionOptions,
} from 'typeorm'

import { InternalDb } from 'local-resolver-registrar/js/db'
import { JolocomSDK, NaivePasswordStore } from '../'
import { JolocomTypeormStorage } from '@jolocom/sdk-storage-typeorm'
import { getConnectionConfig } from './util'

const conn1Name = 'auth1'
const conn2Name = 'auth2'

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

test('Authentication interaction', async () => {
  const con1 = getConnection(conn1Name)
  const alice = getSdk(con1)
  alice.setDefaultDidMethod('jun')
  await alice.init()

  const con2 = getConnection(conn1Name)
  const bob = getSdk(con2)
  bob.setDefaultDidMethod('jun')
  await bob.createNewIdentity()

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
