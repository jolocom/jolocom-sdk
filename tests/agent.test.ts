import { destroyAgent, createAgent, meetAgent } from './util'
import { Agent } from 'src'

const conn1Name = 'agentTest1'
const conn2Name = 'agentTest2'

let alice: Agent, bob: Agent
beforeEach(async () => {
  alice = await createAgent(conn1Name)
  await alice.createNewIdentity()

  bob = await createAgent(conn2Name)
  await bob.createNewIdentity()

  await meetAgent(alice, bob)
})

afterEach(async () => {
  await destroyAgent(conn1Name)
  await destroyAgent(conn2Name)
})


describe('processJWT', () => {
  it("does not start a new interaction if token processing fails", async () => {
    const credOffer = await alice.credOfferToken({
      callbackURL: '',
      offeredCredentials: [{ type: 'dummy' }],
    })
    const bobInterxn = await bob.processJWT(credOffer.encode())
    const credResp = await bobInterxn.createCredentialOfferResponseToken([{ type: 'not dummy' }])

    const startSpy = jest.spyOn(alice.interactionManager, 'start')
    await expect(alice.processJWT(credResp.encode())).rejects.toThrow()
    await expect(startSpy).not.toHaveBeenCalled()
    startSpy.mockRestore()
  })

  it("does not call processInteractionToken after starting a new interaction", async () => {
    const credOffer = await alice.authRequestToken({
      callbackURL: '',
      description: 'test'
    })
    const startOrig = bob.interactionManager.start.bind(bob.interactionManager)
    let processInteractionTokenSpy: jest.SpyInstance
    const startSpy = jest.spyOn(bob.interactionManager, 'start').mockImplementation(
      async (token, transportAPI) => {
        const interxn = await startOrig(token, transportAPI)
        processInteractionTokenSpy = jest.spyOn(interxn, 'processInteractionToken')
        return interxn
      }
    )
    await bob.processJWT(credOffer.encode())
    await expect(startSpy).toHaveBeenCalledTimes(1)

    // NOTE: processInteractionToken is called once BEFORE the spy, so this
    // should be 0, as it should not be called a second time
    await expect(processInteractionTokenSpy!).toHaveBeenCalledTimes(0)

    startSpy.mockRestore()
    processInteractionTokenSpy!.mockRestore()
  })
})

describe('findInteraction', () => {
  it('finds an interaction based on a JSONWebToken', async () => {
    const jwt = await alice.authRequestToken({ callbackURL: '', description: 'test' })
    const found = await alice.findInteraction(jwt)
    expect(found).toBeDefined
    expect(found.id).toEqual(jwt.nonce)
    expect(found.firstMessage).toEqual(jwt)
  })

  it('finds an interaction based on an encoded jwt', async () => {
    const jwt = await alice.authRequestToken({ callbackURL: '', description: 'test' })
    const found = await alice.findInteraction(jwt.encode())
    expect(found).toBeDefined
    expect(found.id).toEqual(jwt.nonce)
    expect(found.firstMessage).toEqual(jwt)
  })

  it('finds an interaction based on an id', async () => {
    const jwt = await alice.authRequestToken({ callbackURL: '', description: 'test' })
    const found = await alice.findInteraction(jwt.nonce)
    expect(found).toBeDefined
    expect(found.id).toEqual(jwt.nonce)
    expect(found.firstMessage).toEqual(jwt)
  })

  describe('reconstructing an interaction from stored messages', () => {
    it('returns an interaction that has a transportAPI', async () => {
      const jwt = await alice.authRequestToken({ callbackURL: 'dummy', description: 'test' })

      const alice2 = await alice.sdk.initAgent({})
      const interxn = await alice2.findInteraction(jwt.nonce)

      expect(() => interxn.transportAPI).not.toThrow()
    })
  })

  // TODO
  // test findInteraction working with completed credOffer (multiple tokens that
  // need proper sorting!)
})
