# Jolocom SDK

[![npm package @jolocom/sdk](https://img.shields.io/npm/v/@jolocom/sdk?style=flat-square)](https://www.npmjs.com/package/@jolocom/sdk)
[![chat on gitter](https://img.shields.io/gitter/room/jolocom/jolocom-sdk?style=flat-square)](https://gitter.im/jolocom/jolocom-sdk)

[Jolocom](https://jolocom.io) Software Development Kit - Facilitating applications to manage and
interact with digital identities.

Interested in our vision? Take a look at our [whitepaper](https://jolocom.io/wp-content/uploads/2019/12/Jolocom-Whitepaper-v2.1-A-Decentralized-Open-Source-Solution-for-Digital-Identity-and-Access-Management.pdf)

The Jolocom SDK is a toolkit for managing SSI Agents and the interactions carried out between them, allowing services and clients to work together seamlessly with minimal trust assumptions and maximum security. For optimal utility and interoperability, the SDK builds upon implementations of the following specifications:

- [W3C Decentralized Identifiers (DIDs)](https://www.w3.org/TR/did-core/): To provide identifiers for Agents managed by the SDK.
- [W3C Verifiable Credentials (VCs)](https://www.w3.org/TR/vc-data-model/): To allow for verifiable attestations to be exchanged and utilised by Agents.

The SDK is composed of a few core concepts which work together to provide a framework for making use of Decentralized Identities, and provides an interface to the SSI ecosystem via Agents and Interactions.
It is designed to streamline the creation, validation, authentication and processing of signed messages in order to facilitate different protocols enacted between Agents. Messages created by Agents are secured by the security mechanism of their chosen [DID Method](https://w3c.github.io/did-core/).

The SDK itself functions as an Agent Factory. It manages a storage connection and a collection of registered DID Methods, providing storage access and resolution capabilities to the Agents which it creates.

## Documentation
Check out the documentation at [https://jolocom.github.io/jolocom-sdk/](https://jolocom.github.io/jolocom-sdk/) for examples and guides:
- [Installation Guide](https://jolocom.github.io/jolocom-sdk/1.0.0/guides/sdk_install_conf/): Install, configure and instantiate the Jolocom SDK
- [Agents Guide](https://jolocom.github.io/jolocom-sdk/1.0.0/guides/agents): Use an instance of the Jolocom SDK to create an Agent or load it from storage
- [Interactions Guide](https://jolocom.github.io/jolocom-sdk/1.0.0/guides/interaction_flows): Use the created Agents to participate in various SSI interactions and / or issue Verifiable Credentials
- [API documentation](https://jolocom.github.io/jolocom-sdk/1.0.0/api/): browse to the [documentation](https://jolocom.github.io/jolocom-sdk/) and click on "[API](https://jolocom.github.io/jolocom-sdk/1.0.0/api/)" in the top navigation bar.
