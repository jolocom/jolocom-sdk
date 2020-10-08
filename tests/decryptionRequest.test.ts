import { Agent } from '../src'
import { Identity } from 'jolocom-lib/js/identity/identity'
import { createAgent, destroyAgent, meetAgent } from './util'

const conn1Name = 'decrypt1'
const conn2Name = 'decrypt2'
let service: Agent, user: Agent

beforeEach(async () => {
  service = await createAgent(conn1Name)
  await service.createNewIdentity()

  user = await createAgent(conn2Name)
  await user.createNewIdentity()

  await meetAgent(user, service, false)
})

afterEach(async () => {
  await destroyAgent(conn1Name)
  await destroyAgent(conn2Name)
})

test('Decryption Request interaction', async () => {
  // ensure the service is resolvable by the user
  await expect(user.resolve(service.idw.did)).resolves.toBeTruthy()

  // ensure the user is not resolvable by the service
  await expect(service.resolve(user.idw.did)).rejects.toBeTruthy()

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
