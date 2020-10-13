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

The Jolocom SDK requires a set of external services that provide storage and
network transports integrations appropriate to the runtime environment. The
Storage module is required on instantiation, while network transports are
configured (and can be reconfigured) after an SDK instance is created.

### Storage
A storage module is required to persist data (e.g. DID Documents, Verifiable Credentials, Encrypted keys, etc) which is generated or collected as part of various SSI interactions and events. Custom storage backend implementations can be defined, as long as they satisfy the [IStorage](../../api/interfaces/_src_storage_index_.istorage.html) interface.
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

### Network Transports

The SDK currently supports WebSockets and HTTP as data transports. These need to
be configured prior to usage, to inject platform specific solutions.

#### HTTP
The HTTP transport simply requires an implementation of
[fetch](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch).
For Node environments, install `node-fetch` and it will be automatically
configured.  Or to use your custom `fetch` implementation:
```typescript
sdk.transports.http.configure({ fetch: customFetchImplementation })
```

#### WebSocket
The WebSocket transport requires an implementation of [WebSocket](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket).

In Node environments, to use [ws](https://npmjs.com/package/ws) as the WebSocket
implementation, install the pacakge then after instantiating the SDK in your
code:
```typescript
import * as WebSocket from 'ws'
/* .... instantiate SDK .... */
sdk.transports.ws.configure({ WebSocket })
```
