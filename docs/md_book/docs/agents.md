# Agents

An Agent is the core of any service built with the SDK. Each Agent possesses a DID and the capability to perform cryptographic operations with the keys associated with it's DID. Agents are suitable for all roles in any SSI interaction, and can be used for client-server or P2P style services. Common actions which Agents carry out include:

A configured Jolocom SDK instance can be used to instantiate new Agents, equipped with an SSI and capable of participating in various interactions.

The Agent makes use of the modules injected by the SDK to fulfill identity management related functionality. 

Given an instance of the Jolocom SDK, a new agent can be instantiated in a number of ways. If we would like for a new identity (i.e. DID and set of keys) to be created for the instantiated Agent, we can do the following:

```typescript
// ...
sdk.createNewAgent().then(agent => console.log(`did - ${agent.did}`))
```

The next snippet is an alternative way to achieve the same result:

```typescript
...
const agent = sdk.createAgent()
agent.createNewIdentity()
```


- `createAgent`
Returns an unitialized agent. A number of methods can be used to provision the newly created agent with a DID / Wallet.

- `passwordStore` - can be used by the SDK for persisting secrets (e.g. the symmetric encryption key used to encrypt / decrypt the contents of the user's Wallet). For example implementations, check out the "Naive password store" (default for node-js) and the "React native password store" (default for react-native)

---

An unitialized agent (e.g. as returned by `sdk.createAgent`) can be provisioned with an identity (e.g. a DID + a set of signing keys managed by the a wallet) in a number of ways.

### createNewIdentity

Firstly, the agent can be initialized with a new identity. Calling `agent.createNewIdentity()` will delegate to the configured `registrar`, which will make use of the newly created instance of a `IVaultedKeyProvider` to generate required keys, and perform the signing operations required as part of identity creation.
The keys, and resulting DID will be random, and can not be known before creation. In case deterministic creation is desired, alternative methods are described in later sections.

This method makes use of the passed `storage` interface to store the encrypted wallet containing the newly generated keys, and the newly created DID Document.

The `KeyChain` associated with the SDK MUST be configured with a password at this point. (?? Check with @Mina if a pass is generated otherwise)

### loadIdentity

In case identities have been created at a prior point in time (i.e. the Storage implementation already contains encrypted wallet instance), the `loadIdentity` method can be used. If given a DID, the method will attempt to find the associated encrypted wallet / DID Document entries using the `storage` interface. In case no entries have been found, an error is thrown. The DID argument is optional. In case no DID is specified, the first identity found using the `storage` interface is used.

You need to make sure that the `passwordStore` contains the password corresponding to the desired DID.

### createFromMnemonic

In case deterministic identity creation is desired, the `createFromMnemonic` method can be used. This function allows for the deterministic creation of a DID, and the associated keys. A bip39 (slip10?) compliant mnemonic can be passed in. In case the used `registrar` does not implement the `recoverFromSeed` method, an error is thrown. The deterministic derivation of keys from a seed is delegated to the `registrar` implementation. Internally, bip32, slip10, or other specifications can be used. The `registrar` implementation encapsulates the specification, as well as the metadata required for derivation (e.g. paths, indexes, etc.)

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
