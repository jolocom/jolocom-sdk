import { createConnection, getConnection } from 'typeorm'
import { getSdk } from './util'

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
  const SDK = await getSdk('test')
  console.log(SDK)
})
