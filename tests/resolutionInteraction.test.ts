import { Agent } from '../src'

import { createAgent, destroyAgent, meetAgent } from './util'
const conn1Name = 'resolution1'
const conn2Name = 'resolution2'
let service: Agent, user: Agent

beforeEach(async () => {
  service = await createAgent(conn1Name, 'jun')
  await service.createNewIdentity()

  user = await createAgent(conn2Name, 'jun')
  await user.createNewIdentity()
})

afterEach(async () => {
  await destroyAgent(conn1Name)
  await destroyAgent(conn2Name)
})

test('Resolution interaction', async () => {
  // insert the service's KEL to the user DB (make the service resolvable)
  await meetAgent(user, service, false)

  // ensure the service is resolvable by the user
  await expect(user.resolve(service.idw.did)).resolves.toBeTruthy()

  // ensure the user is not resolvable by the service
  await expect(service.resolve(user.idw.did)).rejects.toBeTruthy()

  // create a resolution request
  const serviceResRequest = await service.resolutionRequestToken()

  // process the services request and get the handle for the interaction
  const userInteraction = await user.processJWT(serviceResRequest)

  // create a resolution response
  const userResponse = await userInteraction.createResolutionResponse()

  // process the resolution response, containing the state update proof of the User
  await service.processJWT(userResponse.encode())

  await expect(service.resolve(user.idw.did)).resolves.toBeTruthy()
})
