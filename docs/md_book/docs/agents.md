# Agents

An Agent is the core of any service built with the SDK. Each Agent possesses a DID and the capability to perform cryptographic operations with the keys associated with it's DID. Agents are suitable for all roles in any SSI interaction, and can be used for client-server or P2P style services. Common actions which Agents carry out include:

An Agent can be created as follows:

```typescript

const agent = sdk.createAgent()
```

Two optional arguments can be provided to the `createAgent` function:

- `passwordOrStore` - The SDK makes use of a Password Store component, used for persisting secrets (e.g. the symmetric encryption key used to encrypt / decrypt the contents of the user's Wallet). A custom implementation satisfying the `IPasswordStore` interface can be passed at this point. 
In case the argument is of type `string`, a [NaivePasswordStore](TODO) will be instantiated with the provided password. In case no argument is provided, the aforementioned `NaivePasswordStore` is initiated with a encryption random password. *For an example integration with react-native, see the [JolocomKeychainPasswordStore](JolocomKeychainPasswordStore).*
- `didMethodName` - The DID Method used by the Agent. This DID Method will be used when creating an identity for the agent, as well as when recovering an identity from seed material. The Agent will still retain the ability to resolve across all DID Methods supported by the SDK. In case no argument is provided the DID Method registered as default on the SDK instance is used.

At this stage, the Agent does not yet have an associated DID / set of keys. There are a number of ways to provision an Agent with an identity:

## Creating a new random identity

To provision the Agent with a new random identity (i.e. DID and set of keys), the following function can be used:

```typescript
agent.createNewIdentity()
```

Based on the DID Method the Agent is configured to use, the appropriate identity creation / "anchoring" operations are executed (e.g. creating and broadcasting Blockchain transactions, interfacing with various distributed storage backends, etc.). If succesfull, the function should return the DID Document, and the corresponding signing keys, for the newly created identity.

Besides returning the data associated with the new identity, the Agent will also persist the created encrypted wallet (containing keys associated with the identity) and DID Document locally (allowing for the identity to be reused at later points), using the storage backend.

## Loading an existing identity
To provision the Agent with a previously created identity, the following function can be used:

```typescript
agent.loadIdentity('did:jolo:aaa...fff')
```

If a DID is provded, the method will attempt to find the associated encrypted wallet / DID Document entries using the `storage` interface. In case no entries have been found, an error is thrown. In case no argument is provided to the function, the first identity found is used.
The password in the Agent's Password Store is used to decrypt the retrieved encrypted wallet.

### createFromMnemonic

In case deterministic identity generation is desired, the `createFromMnemonic` method can be used. This function allows for the deterministic creation of a DID, and the associated keys. A bip39 (slip10?) compliant mnemonic can be passed in. In case the used `registrar` does not implement the `recoverFromSeed` method, an error is thrown. The deterministic derivation of keys from a seed is delegated to the `registrar` implementation. Internally, bip32, slip10, or other specifications can be used. The `registrar` implementation encapsulates the specification, as well as the metadata required for derivation (e.g. paths, indexes, etc.)

Once the keys and the DID have been derived, the `registrar` module is used to register the identity on the corresponding network (depending on the DID method used). In case the identity is already "anchored", an error is thrown, to prevent accidental identity updates.
In case the desired functionality is to register the identity regardless of whether it's already registered on the ledger, a second boolean argument `shouldOverwrite` can be set to `true`

### loadFromMnemonic

In case deterministic identity creation is desired, the `createFromMnemonic` method can be used. This function allows for the deterministic creation of a DID, and the associated keys. A bip39 (slip10?) compliant mnemonic can be passed in. In case the used `registrar` does not implement the `recoverFromSeed` method, an error is thrown. The deterministic derivation of keys from a seed is delegated to the `registrar` implementation. Internally, bip32, slip10, or other specifications can be used. The `registrar` implementation encapsulates the specification, as well as the metadata required for derivation (e.g. paths, indexes, etc.)

Once the keys and the DID have been derived, the `resolver` module is used to ensure that the identity is "anchored" (the meaning and implementation of this functionality is defined by the DID Method). In case the identity can not be resolved, an error is thrown.

This method can be used to "recover" control over an existing identity, given only the bip39 seed phrase (i.e. the same seed phrase used in the `createFromMnemonic` call).

- [Authentication](interaction_flows.md#authentication)
- [Authorization](interaction_flows.md#authorization)
- Verifiable Credential Creation
- [Issuance and Receipt of Verifiable Credentials](interaction_flows.md#verifiable)
- [Requesting, Providing and Verifying of Verifiable Credentials](interaction_flows.md#verifiable)

For information on creating and managing Agents, see the [Identity Management](identity_management.md) section. For information on using Agents for services and interactions, see the section on [Interaction Flows](interaction_flows.md).
