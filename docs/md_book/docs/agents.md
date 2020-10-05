# Document Title

- [ ] Anatomy of an agent, i.e. the essential components

In order for an agent to be able to fulfill it's responsibilities (e.g. interactions, credential creation, identity management), a number of interfaces / components must be provided (either upon SDK construction, or upon agent creation).

The following sections will briefly outline the purpose and relationship between the various interfaces.

The core components are:

- **A Collection of supported DID methods** - exposed through

Two arguments can be provided
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



---
---

It might be useful to first look at the two possible way to create an `agent` instance using the Jolocom Sdk. Let's start with the simplest one first:

# TODO -> jolo or did:jolo?
```typescript
const agent = sdk.createNewAgent("secretPassword", "jolo")
```

*Note - The snippet above assumes a configured Jolocom SDK instance (`sdk`) is defined. See section TODO for additional information on instantiating the Jolocom SDK*
