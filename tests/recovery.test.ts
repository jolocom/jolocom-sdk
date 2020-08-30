import {
  createConnection,
  getConnection,
  Connection,
  ConnectionOptions,
} from 'typeorm'

import { InternalDb } from 'local-did-resolver'
import { JolocomSDK, NaivePasswordStore } from '../'
import { JolocomTypeormStorage } from '@jolocom/sdk-storage-typeorm'

const testConnection1: ConnectionOptions = {
  name: 'default',
  type: 'sqlite',
  database: ':memory:',
  dropSchema: true,
  entities: ['node_modules/@jolocom/sdk-storage-typeorm/js/src/entities/*.js'],
  synchronize: true,
  logging: false,
}

const testConnection2: ConnectionOptions = {
  name: 'con2',
  type: 'sqlite',
  database: ':memory:',
  dropSchema: true,
  entities: ['node_modules/@jolocom/sdk-storage-typeorm/js/src/entities/*.js'],
  synchronize: true,
  logging: false,
}

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
  let conn1 = getConnection()
  await conn1.close()

  let conn2 = getConnection('con2')
  return conn2.close()
})

const mnemonic64A = 'primary fetch primary fetch primary fetch primary fetch primary fetch primary fetch primary fetch primary fetch primary fetch primary fetch primary fetch primary foster'

const mnemonicRandom = 'heavy clock off seed chef rifle praise punch grace argue outer traffic play rescue night comic install opera off system figure rice still hungry' 

const pass = 'secret'
test('Recover existing jolo identity from mnemonic', async () => {
  const con = getConnection()
  const agent = getSdk(con)
  agent.didMethods.setDefault(agent.didMethods.get('jolo'))
  const expectedDid = 'did:jolo:b2d5d8d6cc140033419b54a237a5db51710439f9f462d1fc98f698eca7ce9777'

  expect((await agent.loadFromMnemonic(mnemonic64A, pass)).did).toBe(expectedDid)
  expect(agent.keyProvider.id).toBe(expectedDid)
  expect(await agent.keyProvider.getPubKeys(pass)).toHaveLength(4)
  expect(agent.identityWallet.didDocument.publicKey).toHaveLength(2)
})

test('Fail to recover non existing jolo identity from mnemonic', async () => {
  const con = getConnection()
  const agent = getSdk(con)
  agent.didMethods.setDefault(agent.didMethods.get('jolo'))

  expect(agent.loadFromMnemonic(mnemonicRandom, pass)).rejects.toEqual('')
})


test('Load local identity from mnemonic', async () => {
  const con = getConnection()
  const agent = getSdk(con)
  agent.didMethods.setDefault(agent.didMethods.get('jun'))
  const expectedDid = 'did:jun:FhHgj-WRVqeODSIJl1a8GDV9KG9WM8HLIo6ucni6zlHcyJNhQxHW5nA6YLR4NQuOB2X1xdkYUq7VRBUBahCYmpA'

  expect(agent.keyProvider.id).toBe(expectedDid)
  expect(await agent.keyProvider.getPubKeys(pass)).toHaveLength(4)
  expect(agent.identityWallet.didDocument.publicKey).toHaveLength(2)

  expect((await agent.loadFromMnemonic(mnemonic64A, pass)).did).toBe(expectedDid)
})
