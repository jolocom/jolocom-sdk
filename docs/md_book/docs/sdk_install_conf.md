# Installation and configuration

## Installing the Jolocom SDK

In order to be able to install and run the Jolocom SDK, [Node.js](https://nodejs.org/en/download/) v10 is required.

*Note - Support for higher Node.js versions (i.e. v12, v14) is comming soon*

Run
```bash
npm i @jolocom/sdk jolocom-lib

# In case you use yarn
yarn add @jolocom/sdk jolocom-lib
```

In case you would like to avoid implementing a custom storage backend for the SDK, the [@jolocom/sdk-storage-typeorm](TODO) module should be installed at this point as well.

## Instantiating the Jolocom SDK

The Jolocom SDK relies on an injected storage module / backend to persist data (e.g. DID Documents, Verifiable Credentials, Encrypted keys) required / collected as part of various SSI interactions. Custom storage backend implementations can be defined, as long as they satisfy the `IStorage` interface.

*Note - We intend to simplify the interface in an upcomming release*

The fastest way to get a compliant storage module is by using the [@jolocom/sdk-storage-typeorm](TODO) module:

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
      storage: new JolocomTypeormStorage(connection)
  })
})

```

An additional optional argument, `eventDB`, can be provided to the constructor to specify a custom storage backend for "events" encountered as part of peer resolution flows. This DB will only be used for particular DID methods. In case no argument is passed, the `storage` argument is used instead.

### Configuring the SDK

SDK.didMethods
