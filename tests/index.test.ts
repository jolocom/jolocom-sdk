import {
  createConnection,
  getConnection,
  Connection,
  ConnectionOptions,
} from 'typeorm'

import { InternalDb } from 'local-did-resolver'
// import { createDb } from 'local-did-resolver/js/db'

import { verifySignatureWithIdentity } from 'jolocom-lib/js/utils/validation'
import { JolocomSDK, NaivePasswordStore } from '@jolocom/sdk'
import { SigningFlowState } from '@jolocom/sdk/js/src/lib/interactionManager/signingFlow'
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
  agent.didMethods.setDefault(agent.didMethods.get('jun'))

  await agent.init()
})

test('Authentication interaction', async () => {
  const con = await getConnection()
  const alice = getSdk(con)
  alice.didMethods.setDefault(alice.didMethods.get('jun'))
  await alice.init()

  const bob = getSdk(con)
  bob.didMethods.setDefault(bob.didMethods.get('jun'))
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
  service.didMethods.setDefault(service.didMethods.get('jun'))
  await service.init()

  // insert the service's KEL to the user DB (make the service resolvable)
  const serviceId = service.idw.did.split(':')[2]
  const serviceEL = await serviceDB.eventDB.read(serviceId)

  await userDB.eventDB.append(serviceId, serviceEL)

  const user = getSdk(userCon)
  user.didMethods.setDefault(user.didMethods.get('jun'))
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

  await userCon.close()
})

test('Decryption Request interaction', async () => {
  const serviceCon = await getConnection()
  const userCon = await createConnection(testConnection2)

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

  await userCon.close()
}, 40000)

test('Signing Request interaction', async () => {
  const serviceCon = await getConnection()
  const userCon = await createConnection(testConnection2)

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

  const signReq = await service.signingRequest({
    toSign: data,
    callbackURL: 'nowhere',
  })

  const userSignInteraction = await user.processJWT(signReq)

  const signResponse = await userSignInteraction.createSigningResponseToken()

  const serviceSigInt = await service.processJWT(signResponse.encode())

  const state = serviceSigInt.getSummary().state as SigningFlowState
  // @ts-ignore
  expect(state.signature).toBeDefined()

  expect(
    verifySignatureWithIdentity(
      data,
      state.signature!,
      user.idw.publicKeyMetadata.signingKeyId,
      user.idw.identity,
    ),
  ).resolves.toBeTruthy()

  await userCon.close()
}, 40000)
