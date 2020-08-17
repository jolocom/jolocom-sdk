import {
  createConnection,
  getConnection,
  Connection,
  ConnectionOptions,
} from 'typeorm'
import { InternalDb } from 'local-did-resolver'
import { createDb } from 'local-did-resolver/js/db'

import { JolocomSDK, NaivePasswordStore } from '@jolocom/sdk'
import { JolocomTypeormStorage } from '@jolocom/sdk-storage-typeorm'

const testConnection: ConnectionOptions = {
  type: 'sqlite',
  database: ':memory:',
  dropSchema: true,
  entities: ['node_modules/@jolocom/sdk-storage-typeorm/js/src/entities/*.js'],
  synchronize: true,
  logging: false,
}

const getSdk = (connection: Connection, eDB?: InternalDb) =>
  new JolocomSDK({
    passwordStore: new NaivePasswordStore(),
    storage: new JolocomTypeormStorage(connection),
    eventDB: eDB,
  })

beforeAll(async () => {
  return await createConnection(testConnection)
})

afterAll(async () => {
  let conn = await getConnection()
  return conn.close()
})

test('Create local identity', async () => {
  const agent = getSdk(await getConnection())

  await agent.init({ registerNew: true })

  // TODO Continue from here
})

test('Authentication interaction', async () => {
  const con = await getConnection()
  const edb = {}
  const alice = getSdk(con, createDb(edb))
  const bob = getSdk(con, createDb(edb))

  await alice.init({ registerNew: true })
  await bob.init({ registerNew: true })

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
