test('FIXME: Recovery test disabled, see test file', () => {
})

/*
 * These tests is disabled because `agent.loadFromMnemonic` fails during
 * hdkey derivation, because `Buffer instanceof Uint8Array` returns false inside
 * jest environments.... https://github.com/facebook/jest/issues/4422
 *
import { Agent } from '../src'
import { createAgent, destroyAgent } from './util'

const conn1Name = 'recovery1'

let agent: Agent

afterEach(async () => {
  await destroyAgent(conn1Name)
})

const mnemonic64A =
  'primary fetch primary fetch primary fetch primary fetch primary fetch primary fetch primary fetch primary fetch primary fetch primary fetch primary fetch primary foster'

const mnemonicRandom =
  'heavy clock off seed chef rifle praise punch grace argue outer traffic play rescue night comic install opera off system figure rice still hungry'

const pass = 'secret'
test('Recover existing jolo identity from mnemonic', async () => {
  agent = await createAgent(conn1Name, 'jolo', pass)

  const expectedDid =
    'did:jolo:b2d5d8d6cc140033419b54a237a5db51710439f9f462d1fc98f698eca7ce9777'

  const identityWallet = await agent.loadFromMnemonic(mnemonic64A)

  expect(identityWallet.did).toBe(expectedDid)
  expect(agent.keyProvider.id).toBe(expectedDid)
  expect(await agent.keyProvider.getPubKeys(pass)).toHaveLength(3)
  expect(agent.identityWallet.didDocument.publicKey).toHaveLength(1)
})

test('Fail to recover non existing jolo identity from mnemonic', async () => {
  agent = await createAgent(conn1Name, 'jolo', pass)

  return expect(agent.loadFromMnemonic(mnemonicRandom)).rejects.toBeInstanceOf(
    Error,
  )
})

test('Load local identity from mnemonic', async () => {
  agent = await createAgent(conn1Name, 'jun', pass)
  const expectedDid =
    'did:jun:Er9pmwbXpDOd_Vp46jVJUrZGjW-ujSXeoobGS77z2_Po'

  const identityWallet = await agent.loadFromMnemonic(mnemonic64A)

  expect(identityWallet.did).toBe(expectedDid)
  expect(agent.keyProvider.id).toBe(expectedDid)
  expect(await agent.keyProvider.getPubKeys(pass)).toHaveLength(4)
  expect(agent.identityWallet.didDocument.publicKey).toHaveLength(2)
})
*/
