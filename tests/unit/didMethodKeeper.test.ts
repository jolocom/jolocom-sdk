import { DidMethodKeeper } from '../../js/didMethodKeeper'

const didMethodStub = (prefix: string) => ({
  prefix,
  resolver: {
    prefix,
    resolve: jest.fn(),
  },
  registrar: {
    prefix,
    encounter: jest.fn(),
    create: jest.fn(),
    updatePublicProfile: jest.fn(),
  },
})

describe('getForDid', () => {
  test.each([
    ['testMethodName1', '1did:testMethodName1:test1234'],
    ['testMethodName2', 'did2:testMethodName2:test1234'],
    ['testMethodName3', 'test:testMethodName3:test1234'],
    ['testMethodName4', '12345:testMethodName4:test1234'],
  ])('with valid DID method name "%s" and invalid DID "%s" will throw error', (methodName: string, did: string) => {
      const registry = new DidMethodKeeper()

      registry.register(methodName, didMethodStub(methodName))

      expect(() => registry.getForDid(did)).toThrow('DID method resolving. Could not parse DID: "' + did + '"!')
    },
  )

  test.each([
    ['testMethodName1', 'did:testMethodName1:validMethodSpecificId'],
    ['testMethodName2', 'did:testMethodName2:v2:validMethodSpecificId'],
    ['testMethodName3:v2', 'did:testMethodName3:v2:v3:validMethodSpecificId'],
  ])('with valid DID method name "%s" will return correct DID method', (methodName: string, validDid: string) => {
      const expectedDidMethod = didMethodStub(validDid)
      const registry = new DidMethodKeeper()
      registry.register(methodName, expectedDidMethod)

      const didMethod = registry.getForDid(validDid)

      expect(didMethod).toEqual(expectedDidMethod)
    },
  )

  test('with not registered DID method will throw error', () => {
    const did = 'did:testNotRegisteredDidMethodName:validMethodSpecificId'
    const registry = new DidMethodKeeper()

    expect(() => registry.getForDid(did)).toThrow(
      'DID method resolving. DID method for DID "' + did + '" is not registered!',
    )
  })
})
