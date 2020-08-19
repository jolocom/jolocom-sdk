import {
  createConnection,
  getConnection,
  Connection,
  ConnectionOptions,
} from 'typeorm'

import { InternalDb } from 'local-did-resolver'
import { createDb } from 'local-did-resolver/js/db'

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

  const sqlDB = new JolocomTypeormStorage(con)
  const inMemDB = createDb()

  // in this test, the service is "anchored" (the user can resolve them), and
  // the user is "unanchored" (the service cannot resolve them initially)
  const service = getSdk(con)
  await service.init({ registerNew: true })

  // insert the service's KEL to the user DB (make the service resolvable)
  const serviceId = service.idw.did.split(':')[2]
  const serviceEL = await sqlDB.eventDB.read(serviceId)
  await inMemDB.append(serviceId, serviceEL)

  const user = getSdk(con, inMemDB)
  await user.init({ registerNew: true })

  // ensure the service is resolvable by the user
  expect(
    user.didMethods.getDefault().resolver.resolve(service.idw.did),
  ).resolves.toBeTruthy()

  // ensure the user is not resolvable by the service
  expect(
    service.didMethods.getDefault().resolver.resolve(user.idw.did),
  ).rejects.toBeTruthy()

  const serviceResRequest = await service.resolutionRequestToken()

  const userInteraction = await user.processJWT(serviceResRequest)

  const userResponse = await userInteraction.createResolutionResponse()
  await user.processJWT(userResponse.encode())

  const serviceInteraction = await service.processJWT(userResponse.encode())

  expect(serviceInteraction.getMessages().map(m => m.encode())).toEqual(
    userInteraction.getMessages().map(m => m.encode()),
  )
})
