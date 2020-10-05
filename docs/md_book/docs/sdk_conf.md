TODO add links for example implementations

## Usage

The first step is to create a new instance of the Jolocom SDK, and configure it according to the desired use case.

```typescript
import { JolocomSDK, NaivePasswordStore } from '@jolocom/sdk'
import { JolocomTypeormStorage } from '@jolocom/sdk-storage-typeorm'
import { createConnection } from 'typeorm'

const typeOrmConfig = {
  name: 'demoDb',
  type: 'sqlite',
  database: ':memory:',
  dropSchema: true,
  entities: ['node_modules/@jolocom/sdk-storage-typeorm/js/src/entities/*.js'],
  synchronize: true,
  logging: false,
}

createConnection(typeOrmConfig).then(connection => {
  const sdk = new JolocomSDK({
      passwordStore: new NaivePasswordStore(),
      storage: new JolocomTypeormStorage(connection)
  })
})

```

The following arguments can be passed to the Jolocom-SDK upon instantiation:
- `passwordStore` - can be used by the SDK for persisting secrets (e.g. the symmetric encryption key used to encrypt / decrypt the contents of the user's Wallet). For example implementations, check out the "Naive password store" (default for node-js) and the "React native password store" (default for react-native)

- `storage` - the storage backend which will be used by the Jolocom SDK to persist data (e.g. DID Documents, Verifiable Credentials, Encrypted keys) required / collected as part of various SSI interactions. This component is required for a number of core SDK functionalities.
For an example implementation, check out the [sdk-storage-typeorm repository](https://github.com/jolocom/sdk-storage-typeorm) (default for node-js and react native)

- `eventDB` - this optional argument can be used to configure a custom storage backend for "events" encountered as part of peer resolution flows. This DB will only be used for particular DID methods. In case no argument is passed, the `storage` argument is used instead.

### Configuring the SDK

A number of options can be configured given an instance of the SDK, for instance:

SDK.didMethods
SDK.plugins


## Development

1. Clone the sdk repository to your computer.
2. `cd` into the directory and run `yarn` or `yarn install` from your terminal to install the required packages.

To run a repl, use `yarn repl`.

### Testing

We use [Jest](https://jestjs.io) for unit tests. To run unit tests, with watch and testing coverage display enabled:

```bash
yarn test --watch --coverage
```
