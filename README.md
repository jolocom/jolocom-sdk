# Jolocom SDK

[![npm package @jolocom/sdk](https://img.shields.io/npm/v/@jolocom/sdk?style=flat-square)](https://www.npmjs.com/package/@jolocom/sdk)
[![chat on gitter](https://img.shields.io/gitter/room/jolocom/jolocom-sdk?style=flat-square)](https://gitter.im/jolocom/jolocom-sdk)

[Jolocom](https://jolocom.io) Software Development Kit - Facilitating applications to manage and
interact with digital identities.

Interested in our vision? Take a look at our [whitepaper](https://jolocom.io/wp-content/uploads/2019/12/Jolocom-Whitepaper-v2.1-A-Decentralized-Open-Source-Solution-for-Digital-Identity-and-Access-Management.pdf)

<!-- markdown-toc start - Don't edit this section. Run M-x markdown-toc-refresh-toc -->

**Table of Contents**

- [Jolocom SDK](#jolocom-sdk)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
    - [In another project](#in-another-project)
    - [Running a debug version for development](#running-a-debug-version-for-development)
  - [Testing](#testing)
  - [Usage](#usage)
    - [Authentication](#authentication)
    - [Credential Request](#credential-request)
    - [Credential Issance](#credential-issance)
  - [Code Style and Formatting](#code-style-and-formatting)

<!-- markdown-toc end -->

## Prerequisites

- Set-up requires [Node.js](https://nodejs.org/en/download/) to be installed on your computer.
  - `Node.js v10` is required to build the project.
- We use [Yarn](https://yarnpkg.com) as our package manager.

## Installation

### In another project

1. use `npm i jolocom-sdk jolocom-lib` or `yarn add jolocom-sdk jolocom-lib`
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

## Usage

The SDK provides an interface to the SSI ecosystem via Agents and Interactions. It is designed to streamline the creation, validation, authentication and processing of signed messages in order to facilitate different protocols enacted between Agents. Messages created by Agents are secured by the security mechanism of their chosen [DID Method](https://w3c.github.io/did-core/).

### Authentication

An authentication flow is a simple protocol where one party requests that another party authenticate themselves:

```typescript
// Hello Alice!
const alice = new JolocomSDK(optionsForAlice)
await alice.init()

// Hello Bob!
const bob = new JolocomSDK(optionsForBob)
await bob.init()

// Alice would like to know that Bob is indeed Bob
// so she asks him!
const authRequest = await alice.authRequest({
  callbackURL: myCallbackURL,
  description: 'are you bob?',
})

// Bob hears her ask
const bobsInteraction = await bob.processJWT(authRequest)

// and decides to respond to her question
const bobsAuthResponse = await bobsInteraction.createAuthenticationResponse()

// Alice hears his answer, and knows that he is indeed Bob!
const alicesInteraction = await alice.processJWT(bobsAuthResponse.encode())
```

### Credential Request

A Credential Request is a message requesting a set of [Verifiable Credentials](https://www.w3.org/TR/vc-data-model/), each of which may have a set of requirements:

```typescript
// Hello Alice!
const alice = new JolocomSDK(optionsForAlice)
await alice.init()

// Hello Bob!
const bob = new JolocomSDK(optionsForBob)
await bob.init()

// Alice would like to know Bob's name, and that he is older than 18 years
// so she asks him!
const authRequest = await alice.credRequestToken({
  callbackURL: myCallbackURL,
  credentialRequirements: [
    {
      type: ['Name'],
      constraints: [],
    },
    {
      type: ['Age'],
      constraints: [constraintFunctions.greater('age', '18')],
    },
  ],
})

// Bob hears her ask
const bobsInteraction = await bob.processJWT(authRequest)

// and decides to respond to her question
const bobsAuthResponse = await bobsInteraction.createCredentialResponse([
  ...bobsCredentials,
])

// Alice hears his answer, and knows that he is indeed over 18, and that his name is Bob!
const alicesInteraction = await alice.processJWT(bobsAuthResponse.encode())
```

### Credential Issance

A Credential Issuance is a process of issuing a set of [Verifiable Credentials](https://www.w3.org/TR/vc-data-model/), potentially based on a set of required credentials:

```typescript
// Hello Alice!
const alice = new JolocomSDK(optionsForAlice)
await alice.init()

// Hello Bob!
const bob = new JolocomSDK(optionsForBob)
await bob.init()

// Alice would like to give bob a Happy Birthday credential
// so she offers him one!
const credOffer = await alice.credOfferToken({
  callbackURL: myCallbackURL,
  offeredCredentials: [{
    type: 'HappyBirthdayCredential',
  }],
})

// Bob hears her ask
const bobsInteraction = await bob.processJWT(credOffer)

// and decides to accept the birthday card
const bobsAuthResponse = await bobsInteraction.createCredentialOfferResponseToken([
  {type: 'HappyBirthdayCredential'}
])

// Alice hears his answer
const alicesInteraction = await alice.processJWT(bobsAuthResponse.encode())

// Creates an issuance token with a new credential
const alicesIssuence = await alicesInteraction.createCredentialReceiveToken([
  await alice.signedCredential({
    metadata: {
      type: ['Credential', 'HappyBirthdayCredential'],
      name: 'Birthday Card',
      context: [{
        HappyBirthdayCredential: 'https://identity.jolocom.com/terms/HappyBirthdayCredential',
        schema: 'https://schema.org/',
      }]
    },
    subject: bob.idw.did,
    claim: {},
  }),
])

// And responds with the newly issued Birthday Card credential
const bobReceives = await bob.processJWT(alicesIssuence.encode())
```

## Code Style and Formatting

- We use [ESLint](https://eslint.org/) and [Prettier](https://prettier.io/) to keep a consistent style across the codebase.
  - There are plugins available for a range of IDEs and text editors; automatic formatting on save is also supported in some editors.
- `yarn format` will format files automatically as much as possible.

Copyright (C) 2014-2020 JOLOCOM GmbH
