import { createAgent, destroyAgent } from './util'
import { SigningFlowState } from '../src/interactionManager/signingFlow'
import { JolocomSDK } from '../'
import { entropyToMnemonic } from 'jolocom-lib/js/utils/crypto'
import { Identity } from 'jolocom-lib/js/identity/identity'
import { verifySignatureWithIdentity } from 'jolocom-lib/js/utils/validation'

const conn1Name = 'signing1'
const conn2Name = 'signing2'
let service: JolocomSDK, user: JolocomSDK

beforeEach(async () => {
  service = await createAgent(conn1Name)
  // in this test, the service is "anchored" (the user can always resolve them)
  service.setDefaultDidMethod('jolo')
  await service.loadFromMnemonic(
    entropyToMnemonic(Buffer.from('a'.repeat(64), 'hex')),
  )

  user = await createAgent(conn2Name)
  // the user is "unanchored" (the service cannot resolve them initially)
  user.setDefaultDidMethod('jun')
  await user.init()
})

afterEach(async () => {
  await destroyAgent(conn1Name)
  await destroyAgent(conn2Name)
})

test('Signing Request interaction', async () => {
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

  const signReq = await service.signingRequest({
    toSign: data,
    callbackURL: 'nowhere',
  })

  const userSignInteraction = await user.processJWT(signReq)
  const signResponse = await userSignInteraction.createSigningResponseToken()

  const serviceSigInt = await service.processJWT(signResponse.encode())

  const state = serviceSigInt.getSummary().state as SigningFlowState
  await expect(state.signature).toBeDefined()

  await expect(
    verifySignatureWithIdentity(
      data,
      state.signature!,
      user.idw.publicKeyMetadata.signingKeyId,
      user.idw.identity,
    ),
  ).resolves.toBeTruthy()
})
