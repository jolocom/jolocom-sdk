import {
  createConnection,
  getConnection,
  Connection,
  ConnectionOptions,
} from 'typeorm'

import { InternalDb } from 'local-did-resolver'
// import { createDb } from 'local-did-resolver/js/db'

import { JolocomSDK, NaivePasswordStore } from '@jolocom/sdk'
import { JolocomTypeormStorage } from '@jolocom/sdk-storage-typeorm'

const testConnection1: ConnectionOptions = {
  name: 'default',
  type: 'sqlite',
  database: ':memory:',
  dropSchema: true,
  entities: ['node_modules/@jolocom/sdk-storage-typeorm/js/src/entities/*.js'],
  synchronize: true,
  logging: false,
}

const testConnection2: ConnectionOptions = {
  name: 'con2',
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
  return await createConnection(testConnection1)
})

afterEach(async () => {
  let conn = await getConnection()
  return conn.close()
})

test('Create local identity', async () => {
  const con = await getConnection()
  const agent = getSdk(con)

  await agent.init()
})

test('Authentication interaction', async () => {
  const con = await getConnection()
  const alice = getSdk(con)
  await alice.init()

  const bob = getSdk(con)
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

test('Resolution interaction', async () => {
  const serviceCon = await getConnection()
  const userCon = await createConnection(testConnection2)

  const serviceDB = new JolocomTypeormStorage(serviceCon)
  const userDB = new JolocomTypeormStorage(userCon)

  // in this test, the service is "anchored" (the user can always resolve them), and
  // the user is "unanchored" (the service cannot resolve them initially)
  const service = getSdk(serviceCon)
  await service.init()

  // insert the service's KEL to the user DB (make the service resolvable)
  const serviceId = service.idw.did.split(':')[2]
  const serviceEL = await serviceDB.eventDB.read(serviceId)

  await userDB.eventDB.append(serviceId, serviceEL)

  const user = getSdk(userCon)
  await user.init()

  // ensure the service is resolvable by the user
  expect(
    user.didMethods.getDefault().resolver.resolve(service.idw.did),
  ).resolves.toBeTruthy()

  // ensure the user is not resolvable by the service
  expect(
    service.didMethods.getDefault().resolver.resolve(user.idw.did),
  ).rejects.toBeTruthy()

  // create a resolution request
  const serviceResRequest = await service.resolutionRequestToken()

  // process the services request and get the handle for the interaction
  const userInteraction = await user.processJWT(serviceResRequest)

  // create a resolution response
  const userResponse = await userInteraction.createResolutionResponse()

  // process the resolution response, containing the state update proof of the User
  await service.processJWT(userResponse.encode())

  expect(
    service.didMethods.getDefault().resolver.resolve(user.idw.did),
  ).resolves.toBeTruthy()

  await userCon.close()
})
