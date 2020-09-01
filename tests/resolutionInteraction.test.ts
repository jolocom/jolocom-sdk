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

const conn1Name = 'resolution1'
const conn2Name = 'resolution2'

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

test('Resolution interaction', async () => {
  const serviceCon = getConnection(conn1Name)
  const userCon = getConnection(conn2Name)

  const serviceDB = new JolocomTypeormStorage(serviceCon)
  const userDB = new JolocomTypeormStorage(userCon)

  // in this test, the service is "anchored" (the user can always resolve them), and
  // the user is "unanchored" (the service cannot resolve them initially)
  const service = getSdk(serviceCon)
  service.setDefaultDidMethod('jun')
  await service.init()

  // insert the service's KEL to the user DB (make the service resolvable)
  const serviceId = service.idw.did.split(':')[2]
  const serviceEL = await serviceDB.eventDB.read(serviceId)

  await userDB.eventDB.append(serviceId, serviceEL)

  const user = getSdk(userCon)
  user.setDefaultDidMethod('jun')
  await user.init()

  // ensure the service is resolvable by the user
  expect(user.resolve(service.idw.did)).resolves.toBeTruthy()

  // ensure the user is not resolvable by the service
  expect(service.resolve(user.idw.did)).rejects.toBeTruthy()

  // create a resolution request
  const serviceResRequest = await service.resolutionRequestToken()

  // process the services request and get the handle for the interaction
  const userInteraction = await user.processJWT(serviceResRequest)

  // create a resolution response
  const userResponse = await userInteraction.createResolutionResponse()

  // process the resolution response, containing the state update proof of the User
  await service.processJWT(userResponse.encode())

  expect(service.resolve(user.idw.did)).resolves.toBeTruthy()
})
