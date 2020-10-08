# Agents

An Agent represents an Identity capable of interacting with other Agents. It is the core of any service or application built with the SDK.
Agents are suitable for all roles in any SSI interaction, and can be used for client-server or P2P style services.

To create/load an Agent, a JolocomSDK instance is needed, refer to the [Configuration section](./sdk_install_conf.md#instantiating-the-jolocom-sdk) for details.

## Agent Identity
Each Agent possesses an Identity (representing DID Document), that must be
[created](../identity/#creating-an-identity) or [loaded](../identity/#loading-an-identity) from storage to initialize the Agent. Refer to the
[Identity](../identity/) section for more details.


## Agent Interactions
Agents interact together by engaging in [Interaction Flows](interaction_flows.md). Each interaction flow defines a set of signed messages to be exchanged in a certain order between 2 or more Agents.

The messages are signed and verified using the keys associated with each Agent's
DID Document.

Common Interactions Flows are:

- [Authentication](interaction_flows.md#authentication)
- [Authorization](interaction_flows.md#authorization)
- [Verifiable Credential Creation](credentials.md)
- [Issuance and Receipt of Verifiable Credentials](interaction_flows.md#verifiable-credential-issuance)
- [Requesting, Providing and Verifying of Verifiable Credentials](interaction_flows.md#credential-verification)

## Examples

Below, we see an example setup of two Agents which will be used for examples in this documentation. These Agent instances can run within the same Node process, however for this case they can be imagined to be running on a client-server model, where Alice is the server and Bob is the client.

Alices Agent loading:

```typescript
// The Alice Agent (did:jolo:alice) is loaded from the sdk storage
const alice = await sdk.loadIdentity('alicesPassword', 'did:jolo:alice')
```

Bob Agent creation:

```typescript
// The Bob Agent is randomly generated using the 'jun' DID method
const bob = await sdk.createNewAgent('bobsPassword', 'jun')
```

Now that our Agents are instantiated, let's see how they can be used to set up [Interaction Flows](./interaction_flows.md).
