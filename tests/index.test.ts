import {
  createConnection,
  getConnection,
  Connection,
  ConnectionOptions,
} from 'typeorm'

import { InternalDb } from 'local-did-resolver'
// import { createDb } from 'local-did-resolver/js/db'

import { JolocomSDK, NaivePasswordStore } from '@jolocom/sdk'
import {
  JolocomTypeormStorage,
  // EventLogEntity,
} from '@jolocom/sdk-storage-typeorm'

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

beforeEach(async () => {
  return await createConnection(testConnection)
})

afterEach(async () => {
  let conn = await getConnection()
  return conn.close()
})

test('Create local identity', async () => {
  const con = await getConnection()
  const agent = getSdk(con)

  await agent.init({ registerNew: true })
})

test('Authentication interaction', async () => {
  const con = await getConnection()
  const alice = getSdk(con)
  await alice.init({ registerNew: true })

  const bob = getSdk(con)
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

test('Resolution interaction', async () => {
  const con = await getConnection()
  const alice = getSdk(con)
  const bob = getSdk(con)

  await alice.init({ registerNew: true })
  await bob.init({ registerNew: true })

  const aliceResRequest = await alice.resolutionRequestToken(bob.idw.did)

  const bobInteraction = await bob.processJWT(aliceResRequest)

  const bobResponse = await bobInteraction.createResolutionResponse()
  await bob.processJWT(bobResponse.encode())

  const aliceInteraction = await alice.processJWT(bobResponse.encode())

  expect(aliceInteraction.getMessages().map(m => m.encode())).toEqual(
    bobInteraction.getMessages().map(m => m.encode()),
  )
  console.log(aliceInteraction.getSummary().state)
})
