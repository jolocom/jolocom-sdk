import {
  createConnection,
  getConnection,
  Connection,
  ConnectionOptions,
} from 'typeorm'

import { InternalDb } from 'local-resolver-registrar/js/db'

import { SigningFlowState } from '../src/lib/interactionManager/signingFlow'
import { JolocomSDK, NaivePasswordStore } from '../'
import { JolocomTypeormStorage } from '@jolocom/sdk-storage-typeorm'
import { entropyToMnemonic } from 'jolocom-lib/js/utils/crypto'
import { getConnectionConfig } from './util'
import { Identity } from 'jolocom-lib/js/identity/identity'
import { verifySignatureWithIdentity } from 'jolocom-lib/js/utils/validation'

const conn1Name = 'signing1'
const conn2Name = 'signing2'

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

test('Signing Request interaction', async () => {
  const serviceCon = getConnection(conn1Name)
  const userCon = getConnection(conn2Name)

  // in this test, the service is "anchored" (the user can always resolve them)
  const service = getSdk(serviceCon)
  service.didMethods.setDefault(service.didMethods.get('jolo'))

  await service.loadFromMnemonic(
    entropyToMnemonic(Buffer.from('a'.repeat(64), 'hex')),
  )

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

  // the service should be able to resolve the user now
  await expect(service.resolve(user.idw.did)).resolves.toBeInstanceOf(Identity)

  const data = Buffer.from('hello there')

  const signReq = await service.signingRequest({
    toSign: data,
    callbackURL: 'nowhere',
  })

  const userSignInteraction = await user.processJWT(signReq)
  const signResponse = await userSignInteraction.createSigningResponseToken()

  const serviceSigInt = await service.processJWT(signResponse.encode())

  const state = serviceSigInt.getSummary().state as SigningFlowState
  // //// @ts-ignore
  expect(state.signature).toBeDefined()

  expect(
    verifySignatureWithIdentity(
      data,
      state.signature!,
      user.idw.publicKeyMetadata.signingKeyId,
      user.idw.identity,
    ),
  ).resolves.toBeTruthy()
})
