import { createAgent, destroyAgent, meetAgent } from './util'
import { SigningFlowState } from '../src/interactionManager/signingFlow'
import { Agent } from '../src'
import { Identity } from 'jolocom-lib/js/identity/identity'
import { verifySignatureWithIdentity } from 'jolocom-lib/js/utils/validation'

const conn1Name = 'signing1'
const conn2Name = 'signing2'
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

test('Signing Request interaction', async () => {
  // making service resolvable by user
  await meetAgent(user, service, false)

  // ensure the service is resolvable by the user
  await expect(user.resolve(service.idw.did)).resolves.toBeInstanceOf(Identity)

  const data = Buffer.from('hello there')

  const signReq = await service.signingRequest({
    toSign: data,
    callbackURL: 'nowhere',
  })

  const userSignInteraction = await user.processJWT(signReq)
  const signResponse = await userSignInteraction.createSigningResponseToken()

  const serviceSigInt = await service.processJWT(signResponse.encode())

  const state = serviceSigInt.getSummary().state as SigningFlowState
  expect(state.signature).toBeDefined()

  await expect(
    verifySignatureWithIdentity(
      data,
      state.signature!,
      user.idw.publicKeyMetadata.signingKeyId,
      user.idw.identity,
    ),
  ).resolves.toBeTruthy()
})
