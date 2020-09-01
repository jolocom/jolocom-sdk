import { createConnection, getConnection, Connection } from 'typeorm'
import { JolocomTypeormStorage } from '@jolocom/sdk-storage-typeorm'
import { JolocomSDK, NaivePasswordStore } from '..'

const getSdk = async (connection: Connection) =>
  new JolocomSDK({
    passwordStore: new NaivePasswordStore(),
    storage: new JolocomTypeormStorage(connection),
  })

beforeEach(async () =>
  createConnection({
    type: 'sqlite',
    database: ':memory:',
    dropSchema: true,
    entities: [
      'node_modules/@jolocom/sdk-storage-typeorm/js/src/entities/*.js',
    ],
    synchronize: true,
    logging: false,
  }),
)

afterEach(async () => {
  const conn = getConnection()
  return conn.close()
})

test('Create identity', async () => {
  const SDK = getSdk(getConnection())
  console.log(SDK)
})
