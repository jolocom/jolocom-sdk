import {
  createConnection,
  getConnection,
  Connection,
  ConnectionOptions,
} from 'typeorm'
import { JolocomSDK, NaivePasswordStore } from '@jolocom/sdk'
import { JolocomTypeormStorage } from '@jolocom/sdk-storage-typeorm'

const testConnection: ConnectionOptions = {
  type: 'sqlite',
  database: ':memory:',
  dropSchema: true,
  entities: ['node_modules/@jolocom/sdk-storage-typeorm/js/src/entities/*.js'],
  synchronize: true,
  logging: false,
}

const getSdk = (connection: Connection) =>
  new JolocomSDK({
    passwordStore: new NaivePasswordStore(),
    storage: new JolocomTypeormStorage(connection),
  })

beforeAll(async () => {
  return await createConnection(testConnection)
})

afterAll(async () => {
  let conn = await getConnection()
  return conn.close()
})

test('Create local identity', async () => {
  const agent = getSdk(await getConnection())

  await agent.init({ register: true })

  // TODO Continue from here
})

test('Multi identity interaction', async () => {
  const con = await getConnection()
  const alice = getSdk(con)
  const bob = getSdk(con)

  await alice.init({ register: true })
  await bob.init({ register: true })
})
