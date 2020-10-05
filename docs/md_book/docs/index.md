# Introduction

The Jolocom SDK is a toolkit for managing SSI Agents and the interactions carried out between them, allowing services and clients to work together seamlessly with minimal trust assumptions and maximum security. For optimal utility and interoperability, the SDK builds upon implementations of the following specifications:

- [W3C Decentralized Identifiers (DIDs)](https://www.w3.org/TR/did-core/): To provide identifiers for Agents managed by the SDK.
- [W3C Verifiable Credentials (VCs)](https://www.w3.org/TR/vc-data-model/): To allow for verifiable attestations to be exchanged and utilised by Agents.

The SDK is composed of a few core concepts which work together to provide a framework for making use of Decentralized Identities.

## Jolocom SDK

The SDK itself functions as an Agent Factory. It manages a storage connection and a collection of registered DID Methods, providing storage access and resolution capabilities to the Agents which it creates.

For more details, see the [Identity Management](identity_management.md) section. For API documentation, see the API docs.

## Agents

An Agent is the core of any service built with the SDK. Each Agent possesses a DID and the capability to perform cryptographic operations with the keys associated with it's DID. Agents are suitable for all roles in any SSI interaction, and can be used for client-server or P2P style services. Common actions which Agents carry out include:

- [Authentication](interaction_flows.md#authentication)
- [Authorization](interaction_flows.md#authorization)
- Verifiable Credential Creation
- [Issuance and Receipt of Verifiable Credentials](interaction_flows.md#verifiable)
- [Requesting, Providing and Verifying of Verifiable Credentials](interaction_flows.md#verifiable)

For information on creating and managing Agents, see the [Identity Management](identity_management.md) section. For information on using Agents for services and interactions, see the section on [Interaction Flows](interaction_flows.md).

## Interactions

Interactions represent protocols which can be carried out between Agents. An instance of an Interaction tracks the state of a protocol by reducing the exchanged messages into a protocol state representation.

Each Agent possesses a collection of Interactions which represent the "unfinished" interactions they are currently involved in. For more information on Interactions, see the [Interaction Flows](interaction_flows.md) section.

## Messages

Messages are authenticated statements mediating the Interactions which Agents participate in. They take the form of signed JWTs with content specific to the phase of the interaction being carried out.
