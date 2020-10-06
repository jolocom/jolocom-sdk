- Readme : general introduction to the sdk, specifically it's purpose and general idea
- Installation & Configuration : How to install, what is required, how to instantiate. How to configure DID Methods and register plugins on an instance
- Agents : How to instantiate agents given a configured / non-configured SDK instance. What do they inherit from the SDK
- Interactions ...

## Agents

An Agent is the core of any service built with the SDK. Each Agent possesses a DID and the capability to perform cryptographic operations with the keys associated with it's DID. Agents are suitable for all roles in any SSI interaction, and can be used for client-server or P2P style services. Common actions which Agents carry out include:

- [Authentication](interaction_flows.md#authentication)
- [Authorization](interaction_flows.md#authorization)
- [Verifiable Credential Creation](credentials.md)
- [Issuance and Receipt of Verifiable Credentials](interaction_flows.md#verifiable-credential-issuance)
- [Requesting, Providing and Verifying of Verifiable Credentials](interaction_flows.md#credential-verification)

For information on creating and managing Agents, see the [Identity Management](identity_management.md) section. For information on using Agents for services and interactions, see the section on [Interaction Flows](interaction_flows.md).

## Interactions

Interactions represent protocols which can be carried out between Agents. An instance of an Interaction tracks the state of a protocol by reducing the exchanged messages into a protocol state representation.

Each Agent possesses a collection of Interactions which represent the "unfinished" interactions they are currently involved in. For more information on Interactions, see the [Interaction Flows](interaction_flows.md) section.

## Messages

Messages are authenticated statements mediating the Interactions which Agents participate in. They take the form of signed JWTs with content specific to the phase of the interaction being carried out.
