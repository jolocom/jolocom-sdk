Jolocom Software Development Kit - Facilitating applications to manage and
interact with digital identities.

Interested in our vision? Take a look at our [whitepaper](https://jolocom.io/wp-content/uploads/2018/07/Jolocom-Technical-WP-_-Self-Sovereign-and-Decentralised-Identity-By-Design-2018-03-09.pdf)

## Prerequisites

- Set-up requires [Node.js](https://nodejs.org/en/download/) to be installed on your computer.
  - `Node.js v10` is required to build the project.
- We use [Yarn](https://yarnpkg.com) as our package manager.

## Installation

### In another project

1. use `npm i jolocom-sdk` or `yarn add jolocom-sdk`
2. `import { JolocomSDK } from 'jolocom-sdk'`

An instance of an agent can be instantiated with crypto material in a variety of
ways:

- `JolocomSDK.fromMnemonic` BIP39 12 word seed phrase
- `JolocomSDK.fromStore` Connection to a database with seed material
- `JolocomSDK.newDIDFromSeed`Buffer of arbitrary seed entropy

NOTE: using the arbitrary input buffer registers a new identity on the Jolocom
DID Method

### Running a debug version for development

1. Clone the sdk repository to your computer.
2. `cd` into the directory and run `yarn` or `yarn install` from your terminal to install the required packages.

To run a repl, use `yarn repl`.

## Testing

We use Jest for unit tests, and [detox](https://github.com/wix/Detox) + Jest for end-to-end tests.

To run unit tests, with watch and testing coverage display enabled:

```bash
yarn test --watch --coverage
```

## Code Style and Formatting

- We use [ESLint](https://eslint.org/) and [Prettier](https://prettier.io/) to keep a consistent style across the codebase.
  - There are plugins available for a range of IDEs and text editors; automatic formatting on save is also supported in some editors.
- `yarn format` will format files automatically as much as possible.

Copyright (C) 2014-2020 JOLOCOM GmbH
