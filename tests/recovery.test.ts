import {
  createConnection,
  getConnection,
  Connection,
  ConnectionOptions,
} from 'typeorm'

import { InternalDb } from 'local-resolver-registrar/js/db'
import { JolocomSDK, NaivePasswordStore } from '../'
import { getConnectionConfig } from './util'
import { JolocomTypeormStorage } from '@jolocom/sdk-storage-typeorm'

const conn1Name = 'recovery1'
const conn2Name = 'recovery2'

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
  const conn1 = getConnection(conn1Name)
  await conn1.close()

  const conn2 = getConnection(conn2Name)
  return conn2.close()
})

const mnemonic64A =
  'primary fetch primary fetch primary fetch primary fetch primary fetch primary fetch primary fetch primary fetch primary fetch primary fetch primary fetch primary foster'

const mnemonicRandom =
  'heavy clock off seed chef rifle praise punch grace argue outer traffic play rescue night comic install opera off system figure rice still hungry'

const pass = 'secret'
test('Recover existing jolo identity from mnemonic', async () => {
  const con = getConnection(conn1Name)
  const agent = getSdk(con)
  agent.setDefaultDidMethod('jolo')
  const expectedDid =
    'did:jolo:b2d5d8d6cc140033419b54a237a5db51710439f9f462d1fc98f698eca7ce9777'

  const identityWallet = await agent.loadFromMnemonic(mnemonic64A, pass)

  expect(identityWallet.did).toBe(expectedDid)
  expect(agent.keyProvider.id).toBe(expectedDid)
  expect(await agent.keyProvider.getPubKeys(pass)).toHaveLength(3)
  expect(agent.identityWallet.didDocument.publicKey).toHaveLength(1)
})

test('Fail to recover non existing jolo identity from mnemonic', async () => {
  const con = getConnection(conn1Name)
  const agent = getSdk(con)
  agent.setDefaultDidMethod('jolo')

  return expect(
    agent.loadFromMnemonic(mnemonicRandom, pass),
  ).rejects.toBeInstanceOf(Error)
})

test('Load local identity from mnemonic', async () => {
  const con = getConnection(conn1Name)
  const agent = getSdk(con)

  agent.setDefaultDidMethod('jun')
  const expectedDid =
    'did:jun:FhHgj-WRVqeODSIJl1a8GDV9KG9WM8HLIo6ucni6zlHcyJNhQxHW5nA6YLR4NQuOB2X1xdkYUq7VRBUBahCYmpA'

  const identityWallet = await agent.loadFromMnemonic(mnemonic64A, pass)

  expect(identityWallet.did).toBe(expectedDid)
  expect(agent.keyProvider.id).toBe(expectedDid)
  expect(await agent.keyProvider.getPubKeys(pass)).toHaveLength(4)
  expect(agent.identityWallet.didDocument.publicKey).toHaveLength(2)
})
