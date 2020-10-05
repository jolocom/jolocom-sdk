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
  - [Usage](#usage)
    - [Authentication](#authentication)
    - [Credential Request](#credential-request)
    - [Credential Issance](#credential-issance)
  - [Development](#development)
    - [Testing](#testing)
    - [Code Style and Formatting](#code-style-and-formatting)

<!-- markdown-toc end -->

# Jolocom SDK

The Jolocom SDK is a toolkit for managing SSI Agents and the interactions carried out between them, allowing services and clients to work together seamlessly with minimal trust assumptions and maximum security. For optimal utility and interoperability, the SDK builds upon implementations of the following specifications:

- [W3C Decentralized Identifiers (DIDs)](https://www.w3.org/TR/did-core/): To provide identifiers for Agents managed by the SDK.
- [W3C Verifiable Credentials (VCs)](https://www.w3.org/TR/vc-data-model/): To allow for verifiable attestations to be exchanged and utilised by Agents.

The SDK is composed of a few core concepts which work together to provide a framework for making use of Decentralized Identities.

The SDK provides an interface to the SSI ecosystem via Agents and Interactions. It is designed to streamline the creation, validation, authentication and processing of signed messages in order to facilitate different protocols enacted between Agents. Messages created by Agents are secured by the security mechanism of their chosen [DID Method](https://w3c.github.io/did-core/).

The SDK itself functions as an Agent Factory. It manages a storage connection and a collection of registered DID Methods, providing storage access and resolution capabilities to the Agents which it creates.

// TODO add links
For instructions on how to install the Jolocom SDK, check out the [Installation and Configuration](./docs/md_book/docs/sdk_install_conf.md) section in the documentation folder. For details on how to use the SDK to create "Agents" and subsequently participate in interactions, see the [Agents](./docs/md_book/docs/agents.md) and the [Interactions](./docs/md_book/docs/interaction_flows.md) sections. For API documentation, see the API docs.


## Development

1. Clone the sdk repository to your computer.
2. `cd` into the directory and run `yarn` or `yarn install` from your terminal to install the required packages.

To run a repl, use `yarn repl`.

### Testing

We use [Jest](https://jestjs.io) for unit tests. To run unit tests, with watch and testing coverage display enabled:

```bash
yarn test --watch --coverage
```

### Code Style and Formatting

- We use [ESLint](https://eslint.org/) and [Prettier](https://prettier.io/) to keep a consistent style across the codebase.
  - There are plugins available for a range of IDEs and text editors; automatic formatting on save is also supported in some editors.
- `yarn format` will format files automatically as much as possible.

Copyright (C) 2014-2020 JOLOCOM GmbH
