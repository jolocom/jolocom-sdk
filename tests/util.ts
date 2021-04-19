import { createConnection, getConnection, ConnectionOptions } from 'typeorm'

import { JolocomTypeormStorage } from '@jolocom/sdk-storage-typeorm'

import { Agent, JolocomSDK, NaivePasswordStore } from '../src'

const defaultAgentName = 'j'
const defaultDidMethodName = 'jun'

export async function createAgent(
  name = defaultAgentName,
  didMethodName = defaultDidMethodName,
  pass?: string,
) {
  const sdk = await getSdk(name)

  const didMethod = sdk.didMethods.get(didMethodName)
  const passwordStore = pass
    ? { getPassword: async () => pass }
    : new NaivePasswordStore()
  const agent = new Agent({
    sdk,
    passwordStore,
    didMethod,
  })
  return agent
}

export async function destroyAgent(name = defaultAgentName) {
  const conn = getConnection(name)
  return conn.close()
}

export const getConnectionConfig = (name: string) => ({
  name,
  type: 'sqlite',
  database: ':memory:',
  //database: `./${name}.test.db.sqlite3`, // to save the test databases
  dropSchema: true,
  entities: ['node_modules/@jolocom/sdk-storage-typeorm/js/src/entities/*.js'],
  synchronize: true,
  logging: false,
})

export const getSdk = async (name: string) => {
  const connConfig = getConnectionConfig(name) as ConnectionOptions
  const conn = await createConnection(connConfig)
  return new JolocomSDK({
    storage: new JolocomTypeormStorage(conn),
  })
}

/**
 * Allow alice to resolve bob
 */
export async function meetAgent(alice: Agent, bob: Agent, both = true) {
  const bobId = bob.idw.did.split(':')[2]
  const bobEL = await bob.storage.eventDB.read(bobId)

  await alice.didMethod.registrar.encounter(bobEL)

  if (both) await meetAgent(bob, alice, false)
}
