# Agents

Agent's are Identified by their DID
The Agent makes use of the modules injected by the SDK to fulfill identity management related functionality. 

- `createAgent`
Returns an unitialized agent. A number of methods can be used to provision the newly created agent with a DID / Wallet.

- `createNewAgent`
Returns an initialized agent. The same as calling `createAgent()` followed by `agent.createNewIdentity()`

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
# Document Title

- [ ] Anatomy of an agent, i.e. the essential components

In order for an agent to be able to fulfill it's responsibilities (e.g. interactions, credential creation, identity management), a number of interfaces / components must be provided (either upon SDK construction, or upon agent creation).

The following sections will briefly outline the purpose and relationship between the various interfaces.

The core components are:
  - [ ] DidMethodKeeper
    - [ ] Adding / retrieving a did method
    - [ ] SDK.resolve
    - [ ] Setting / getting the default did method
    - [ ] Mention additional requirements this might impose on supported interactions
  - [ ] Storage interface
    [?] Can we use sdk-storage-typeorm docs here?
  - [ ] Identity Wallet
    *Mention if it's relevant to the user, or if it's used for internal things*
    Reference jolocom lib documentation
    Mention it's a combination of a key provider and SSI related metadata
  - [ ] Password Store
    [?]
