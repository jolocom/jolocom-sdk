# Identity

## Creating an Identity

### Creating an Agent with a random identity

To provision an Agent with a new random identity (i.e. DID and set of keys), the following function can be used:

```typescript
sdk.createNewAgent('demoPassword', 'jolo')
```

Based on the DID Method the Agent is configured to use, the appropriate identity creation / "anchoring" operations are executed (e.g. creating and broadcasting Blockchain transactions, interfacing with various distributed storage backends, etc.). If succesfull, the function returns the DID Document, and the corresponding signing keys, for the newly created identity.

The Agent will also persist the created encrypted wallet (containing keys associated with the identity) and DID Document locally (allowing for the identity to be reused at later points), using the storage backend.

Two optional arguments can be provided to the `createNewAgent` function:

- `passwordOrStore` - The SDK makes use of a Password Store component, used for persisting secrets (e.g. the symmetric encryption key used to encrypt / decrypt the contents of the user's Wallet). A custom implementation satisfying the `IPasswordStore` interface can be passed at this point.
  In case the argument is of type `string`, a [NaivePasswordStore](TODO) will be instantiated with the provided password. In case no argument is provided, the aforementioned `NaivePasswordStore` is initiated with a encryption random password. _For an example integration with react-native, see the [JolocomKeychainPasswordStore](JolocomKeychainPasswordStore)._
- `didMethodName` - The DID Method used by the Agent. This DID Method will be used when creating an identity for the agent, as well as when recovering an identity from seed material. The Agent will still retain the ability to resolve across all DID Methods supported by the SDK. In case no argument is provided the DID Method registered as default on the SDK instance is used.

### Create an Agent based on a BIP39 mnemonic

In the previous section, the created Agent was provisioned with a newly created DID, as well as a set of signing keys. The only way to reuse an identity created this way is by exporting and later reusing the returned Encrypted Wallet.

In case deterministic identity creation is desired, the `agent.createFromMnemonic` method can be used as follows:

```typescript
// the returned Agent instsance is not yet provisioned with an identity
const agent = sdk.createAgent()

agent.createFromMnemonic(
  'hammer soul glare stairs indicate snack address divert mosquito chef season hobby',
)
```

This function allows for the deterministic creation of a DID, and the associated keys. A BIP39 compliant mnemonic is expected as an argument. In case the used `registrar` does not implement the `recoverFromSeed` method, an error is thrown. The deterministic derivation of keys from a seed is delegated to the `registrar` implementation. Internally, BIP32, SLIP0010, or other specifications can be used. The `registrar` implementation encapsulates the specification, as well as the metadata required for derivation (e.g. paths, indexes, etc.)

Based on the DID Method the Agent is configured to use, the appropriate identity creation / "anchoring" operations are then executed (e.g. creating and broadcasting Blockchain transactions, interfacing with various distributed storage backends, etc.). If succesfull, the function returns the DID Document, and the corresponding signing keys, for the recovered identity.

The Agent will also persist the recovered encrypted wallet (containing the recovered keys) and DID Document locally (allowing for the identity to be reused at later points), using the storage backend.

*In case the identity is already registered, an error is thrown (in order to prevent accidental identity updates). In case the desired functionality is to register the identity and overwrite any existing entries (as defined by the DID Method) a second boolean argument `shouldOverwrite` can be set to `true`.*

*Note - the `createFromMnemonic` function will be exposed at the sdk level in a future update*

### Loading an existing identity

As mentioned in the previous sections, using `sdk.createNewIdentity` or `agent.createFromMnemonic` will persist the created / recovered encrypted wallet data using the `storage` backend the SDK was configured with.

To provision the Agent with an identity persisted in the `storage` backend the following function can be used:

```typescript
sdk.loadIdentity('demoPassword', 'did:jolo:aaa...fff')
```

If a DID is provided, the method will attempt to find the associated encrypted wallet / DID Document entries using the `storage` interface. In case no entries have been found, an error is thrown. In case no argument is provided to the function, the first identity found is used.

Note that the password or password store provided should match the password used to previously encrypt the Identity being loaded.

### Recovering an existing identity from a mnemonic

This function is equivalent to the previously described [createFromMnemonic](#createfrommnemonic), except that it does not attempt to register / anchor (as defined by the DID Method) a new identity. Instead, the configured `registrar` is used to derive the key material, and subsequently the DID, which is resolved using the `resolver` module.

In case the DID is resolvable, and the returned DID Document matches the derived DID / keys, the Agent is provisioned with the recovered identity. In case the identity can not be resolved, an error is thrown.

```typescript

// the returned Agent instsance is not yet provisioned with an identity
const agent = sdk.createAgent()

agent.loadFromMnemonic(
  'hammer soul glare stairs indicate snack address divert mosquito chef season hobby',
)
```

This method can be used to "recover" control over an existing identity, given only the BIP39 mnemonic (i.e. the same one used in a previous `createFromMnemonic` call).

## Examples

Below, we see an example setup of two Identities which will be used for examples in this documentation. These Agent instances can run within the same Node process, however for this case they can be imagined to be running on a client-server model, where Alice is the server and Bob is the client. For simplicity, imagine that an SDK instance has been created already for each process, as in the [Configuration section](./sdk_install_conf.md#instantiating-the-jolocom-sdk):

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
