# Installation and configuration

The following sections will briefly describe how to add the Jolocom SDK to your project, as well as briefly outline some of the exposed configuration options (e.g. how to add / remove / switch between DID methods).

## Installing the Jolocom SDK

In order to be able to install and run the Jolocom SDK, [Node.js](https://nodejs.org/en/download/) v10 is required.

Depending on your package manager, you can simply run:

```bash
npm i @jolocom/sdk jolocom-lib
# In case you use yarn
yarn add @jolocom/sdk jolocom-lib
```

_In case you would like to avoid implementing a custom storage backend for the SDK, the [@jolocom/sdk-storage-typeorm](https://www.npmjs.com/package/@jolocom/sdk-storage-typeorm) module should be installed at this point as well._

## Instantiating the Jolocom SDK

The Jolocom SDK relies on an injected storage module / backend to persist data (e.g. DID Documents, Verifiable Credentials, Encrypted keys) required / collected as part of various SSI interactions. Custom storage backend implementations can be defined, as long as they satisfy the `IStorage` interface.

The fastest way to get a compliant storage module is by using the [@jolocom/sdk-storage-typeorm](https://www.npmjs.com/package/@jolocom/sdk-storage-typeorm) module:

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

const connection = await createConnection(typeOrmConfig)
const sdk = new JolocomSDK({
  storage: new JolocomTypeormStorage(connection),
})
```

An additional optional argument, `eventDB`, can be provided to the constructor to specify a custom storage backend for "events" encountered as part of [Peer-Resolution flows](./interaction_flows.md#peer-resolution). This DB will only be used for particular DID methods. In case no argument is passed, the `storage` argument is used instead.
