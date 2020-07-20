import { createConnection, getConnection, Connection } from "typeorm"
import { JolocomSDK, NaivePasswordStore } from '@jolocom/sdk'
import { JolocomTypeormStorage } from '@jolocom/sdk-storage-typeorm'

const getSdk = async (connection: Connection) =>
  new JolocomSDK({
    passwordStore: new NaivePasswordStore(),
    storage: new JolocomTypeormStorage(connection)
  })

beforeEach(() => {
    return createConnection({
        type: "sqlite",
        database: ":memory:",
        dropSchema: true,
        entities: ['node_modules/@jolocom/sdk-storage-typeorm/js/src/entities/*.js'],
        synchronize: true,
        logging: false
    });
});

afterEach(() => {
    let conn = getConnection();
    return conn.close();
});

test("Create local identity", async () => {
  const SDK = await getSdk(getConnection())
  // TODO Continue from here
  // SDK.didMethods.registerDefault('un', { })
});
