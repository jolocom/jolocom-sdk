import {
  createConnection,
  getConnection,
  Connection,
  ConnectionOptions,
} from 'typeorm'

import { JolocomTypeormStorage } from '@jolocom/sdk-storage-typeorm'
import { InternalDb } from '@jolocom/local-resolver-registrar/js/db'

import { JolocomSDK, NaivePasswordStore } from '../'

const defaultAgentName = 'j'

export async function createAgent(name = defaultAgentName) {
  const connConfig = getConnectionConfig(name) as ConnectionOptions
  const conn = await createConnection(connConfig)
  return getSdk(conn)
}

export async function destroyAgent(name = defaultAgentName) {
  const conn = getConnection(name)
  return conn.close()
}

export const getConnectionConfig = (name: string) => ({
  name,
  type: 'sqlite',
  database: ':memory:',
  dropSchema: true,
  entities: ['node_modules/@jolocom/sdk-storage-typeorm/js/src/entities/*.js'],
  synchronize: true,
  logging: false,
})

export const getSdk = (connection: Connection, eDB?: InternalDb) =>
  new JolocomSDK({
    passwordStore: new NaivePasswordStore(),
    storage: new JolocomTypeormStorage(connection),
    eventDB: eDB,
  })

/**
 * Allow alice to resolve bob
 */
export async function meetAgent(alice: JolocomSDK, bob: JolocomSDK) {
  const bobId = bob.idw.did.split(':')[2]
  const bobEL = await bob.storageLib.eventDB.read(bobId)

  await alice.didMethods.getDefault().registrar.encounter(bobEL)
}
