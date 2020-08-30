import {
  createConnection,
  getConnection,
  Connection,
  ConnectionOptions,
} from 'typeorm'
import { getConnectionConfig } from './util'

import { InternalDb } from 'local-resolver-registrar/js/db'
import { JolocomSDK, NaivePasswordStore } from '../'
import { JolocomTypeormStorage } from '@jolocom/sdk-storage-typeorm'

const conn1Name = 'decrypt1'
const conn2Name = 'decrypt1'

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
  let conn1 = getConnection(conn1Name)
  await conn1.close()
  let conn2 = getConnection(conn2Name)
  return conn2.close()
})

test('Decryption Request interaction', async () => {
  const serviceCon = getConnection(conn1Name)
  const userCon = getConnection(conn2Name)

  const serviceDB = new JolocomTypeormStorage(serviceCon)
  const userDB = new JolocomTypeormStorage(userCon)

  // in this test, the service is "anchored" (the user can always resolve them), and
  const service = getSdk(serviceCon)
  service.didMethods.setDefault(service.didMethods.get('jun'))
  await service.init()

  // insert the service's KEL to the user DB (make the service resolvable)
  const serviceId = service.idw.did.split(':')[2]
  const serviceEL = await serviceDB.eventDB.read(serviceId)

  await userDB.eventDB.append(serviceId, serviceEL)

  const user = getSdk(userCon)
  // the user is "unanchored" (the service cannot resolve them initially)
  user.didMethods.setDefault(user.didMethods.get('jun'))
  await user.init()

  // ensure the service is resolvable by the user
  expect(user.resolve(service.idw.did)).resolves.toBeTruthy()

  // ensure the user is not resolvable by the service
  expect(service.resolve(user.idw.did)).rejects.toBeTruthy()

  // create a resolution request
  const serviceResRequest = await service.resolutionRequestToken()

  // process the services request and get the handle for the interaction
  const userResInteraction = await user.processJWT(serviceResRequest)

  // create a resolution response
  const userResponse = await userResInteraction.createResolutionResponse()

  // process the resolution response, containing the state update proof of the User
  await service.processJWT(userResponse.encode())

  const data = Buffer.from('hello there')

  const encryptedData = await service.idw.asymEncryptToDid(
    data,
    user.idw.publicKeyMetadata.encryptionKeyId,
    service.resolver,
  )

  const decReq = await service.rpcDecRequest({
    toDecrypt: encryptedData,
    callbackURL: 'nowhere',
  })

  const userDecInteraction = await user.processJWT(decReq)

  const decryptionResponse = await userDecInteraction.createDecResponseToken()

  await service.processJWT(decryptionResponse.encode())

  expect(
    Buffer.from(decryptionResponse.interactionToken.result, 'base64'),
  ).toEqual(data)
})


