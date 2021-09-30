import { Unsubscriber } from '../../src/events'
import { Agent } from '../../src'

import { createAgent, destroyAgent, meetAgent } from './../util'
const conn1Name = 'interxns1'
const conn2Name = 'interxns2'
let service: Agent, user: Agent

beforeEach(async () => {
  service = await createAgent(conn1Name, 'jun')
  await service.createNewIdentity()

  user = await createAgent(conn2Name, 'jun')
  await user.createNewIdentity()

  await meetAgent(user, service, false)
})

afterEach(async () => {
  await destroyAgent(conn1Name)
  await destroyAgent(conn2Name)
})

describe('Events', () => {
  let userInterxnCreated = jest.fn(),
    userInterxnUpdated = jest.fn(),
    userInterxnResumed = jest.fn(),
    serviceInterxnCreated = jest.fn(),
    serviceInterxnUpdated = jest.fn(),
    serviceInterxnResumed = jest.fn(),
    unsubs: Unsubscriber[] = []

  beforeEach(() => {
    userInterxnCreated.mockReset()
    userInterxnUpdated.mockReset()
    userInterxnResumed.mockReset()
    serviceInterxnCreated.mockReset()
    serviceInterxnUpdated.mockReset()
    serviceInterxnResumed.mockReset()
    unsubs = [
      user.interactionManager.on('interactionCreated', userInterxnCreated),
      user.interactionManager.on('interactionUpdated', userInterxnUpdated),
      user.interactionManager.on('interactionResumed', userInterxnResumed),
      service.interactionManager.on(
        'interactionCreated',
        serviceInterxnCreated,
      ),
      service.interactionManager.on(
        'interactionUpdated',
        serviceInterxnUpdated,
      ),
      service.interactionManager.on(
        'interactionResumed',
        serviceInterxnResumed,
      ),
    ]
  })

  afterEach(() => {
    unsubs.forEach(unsub => unsub())
  })

  test('on creating, updating and resuming interactions', async () => {
    const serviceAuthReq = await service.authRequestToken({
      callbackURL: 'nowhere',
      description: 'test',
    })
    expect(serviceInterxnCreated).toHaveBeenCalledTimes(1)

    const userInterxn = await user.processJWT(serviceAuthReq.encode())
    expect(userInterxnCreated).toHaveBeenCalledWith(userInterxn)
    expect(userInterxnUpdated).not.toHaveBeenCalled()

    await user.processJWT(serviceAuthReq.encode())
    expect(userInterxnResumed).toHaveBeenCalledWith(userInterxn)

    const userResponse = (
      await userInterxn.createAuthenticationResponse()
    ).encode()
    await user.processJWT(userResponse)
    expect(userInterxnUpdated).toHaveBeenCalledWith(userInterxn)

    const serviceInterxn = await service.processJWT(userResponse)
    expect(serviceInterxnCreated).toHaveBeenCalledWith(serviceInterxn)
    expect(serviceInterxnUpdated).toHaveBeenCalledWith(serviceInterxn)

    expect(serviceInterxnCreated).toHaveBeenCalledTimes(1)
    expect(serviceInterxnUpdated).toHaveBeenCalledTimes(1)
    expect(userInterxnCreated).toHaveBeenCalledTimes(1)
    expect(userInterxnUpdated).toHaveBeenCalledTimes(1)
    expect(userInterxnResumed).toHaveBeenCalledTimes(1)
  })

  test('on loading interactions from storage', async () => {
    const serviceAuthReq = await service.authRequestToken({
      callbackURL: 'nowhere',
      description: 'test',
    })
    expect(serviceInterxnCreated).toHaveBeenCalledTimes(1)

    const userInterxn = await user.processJWT(serviceAuthReq.encode())
    expect(userInterxnCreated).toHaveBeenCalledWith(userInterxn)
    expect(userInterxnUpdated).not.toHaveBeenCalled()

    const userResponse = (
      await userInterxn.createAuthenticationResponse()
    ).encode()
    await user.processJWT(userResponse)
    expect(userInterxnUpdated).toHaveBeenCalledWith(userInterxn)

    const serviceInterxn = await service.processJWT(userResponse)
    expect(serviceInterxnCreated).toHaveBeenCalledWith(serviceInterxn)
    expect(serviceInterxnUpdated).toHaveBeenCalledWith(serviceInterxn)

    const serviceReloaded = await service.sdk.initAgent({})

    serviceReloaded.interactionManager.on(
      'interactionCreated',
      serviceInterxnCreated,
    )
    serviceReloaded.interactionManager.on(
      'interactionUpdated',
      serviceInterxnUpdated,
    )
    serviceReloaded.interactionManager.on(
      'interactionResumed',
      serviceInterxnResumed,
    )
    const interxnReloaded = await serviceReloaded.findInteraction(
      serviceInterxn.id,
    )
    expect(interxnReloaded).toBeDefined
    expect(interxnReloaded).not.toStrictEqual(serviceInterxn)

    expect(serviceInterxnCreated).toHaveBeenCalledTimes(1)
    expect(serviceInterxnUpdated).toHaveBeenCalledTimes(1)
    expect(serviceInterxnResumed).toHaveBeenCalledTimes(0)
    expect(userInterxnCreated).toHaveBeenCalledTimes(1)
    expect(userInterxnUpdated).toHaveBeenCalledTimes(1)
    expect(userInterxnResumed).toHaveBeenCalledTimes(0)
  })
})
