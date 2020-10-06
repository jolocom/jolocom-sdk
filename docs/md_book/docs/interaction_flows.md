# Interaction Flows

Interaction Flows are the protocols which Agents use to communicate with each other. With them, services can be easily provided and consumed. In practice, they work by using Agents to produce and consume messages, with an Interaction Manager within each Agent handling the validation and storage for each Interaction.

Each interaction is defined by:

- The Roles played by Agents participating in the interaction
- The set of Message types associated with the type of interaction
- The set of rules associated with the type of interaction which determine the validity of new messages given the previous messages

## Peer Resolution

| Using another Agent as a Resolver

Peer resolution consists of a simple request-response message exchange, where the Requester asks the Resolver to perform [DID resolution](https://w3c-ccg.github.io/did-resolution/) and return the result.

#### Roles

- Requester: Agent who requests the resolution of a DID
- Resolver: Agent who resolves the given DID (or their own) and returns the result

#### Messages

1. Resolution Request: The Requester broadcasts a message which may or may not contain a DID.
2. Resolution Result: If the message contains a DID, the Resolver resolves the DID and returns the [DID Resolution Result](https://w3c-ccg.github.io/did-resolution/#did-resolution-result). Otherwise, the Resolver returns the result of resolving it's own DID. This is intended for the special case of "local" DID methods, which do not have a globally resolvable state.

#### Examples

A simple Peer Resolution flow between our two Agents from the [Identity Management example](./agents.md#examples) looks as follows:

```typescript
const aliceResRequest = await alice.createResolutionRequest({
  description: 'introduce yourself',
  callbackURL: 'https://example.com/onboarding',
})

// ------- the request is received by Bob ------- //
const bobsInteraction = await bob.processJWT(aliceResRequest)
const bobsResResponse = await bobsInteraction.createResolutionResponse()

// ------- Bob's response is received by Alice ------- //
// this adds Bob's identity data (a Key Event Log) to Alice's storage, such that she can now resolve his DID and verify signatures made by him
const alicesInteraction = await alice.processJWT(bobsResResponse.encode())
```

Peer resolution allows for the resolution of Identifiers which rely on a local state proof (e.g. KERI/`did:jun` and `did:peer`) instead of a globally resolvable state. The successful result of resolving such Identifiers is cached by default by the SDK, and they are resolvable by any Agent instance which shares the same EventDB. Think of such a protocol as an "introduction" or "onboarding" of a private DID into a backend system.

Services which are intended for consumption by natural persons are encouraged to provide at least one method for Agents to resolve themselves using this flow, as these "local" Identifiers are designed to solve critical GDPR and User privacy issues affecting DID methods which rely on a global shared state like Blockchains.

## Authentication

| Proving control over an Identifier.

The Authentication flow consists of a simple request-response message exchange, where the contents of the response must match those of the request. Because all Messages are signed and authenticated, the response functions as proof of control by nature of being correctly signed by the keys listed in the DID Document of the issuer. Because of this, in scenarios where a more complex functionality (e.g. Credential Verification) is needed, an additional Authentication flow is not necessary.

#### Roles

- Verifier: Agent who requests and verifies the Authenticity of the Authenticator
- Authenticator: Agent who proves control over their Identifier

#### Messages

1. Authentication Request: The Verifier broadcasts containing only an optional description of the purpose of the authentication.
2. Authentication Response: Contains the same content as the Request.

#### Examples

A simple Authentication flow between our two Agents looks as follows:

```typescript
const authRequest = await alice.authRequest({
  callbackURL: 'https://example.com/auth',
  description: 'are you bob?',
})

// ------- the request is received by Bob ------- //
const bobsInteraction = await bob.processJWT(authRequest)
const bobsAuthResponse = await bobsInteraction.createAuthenticationResponse()

// ------- Bob's response is received by Alice ------- //
const alicesInteraction = await alice.processJWT(bobsAuthResponse.encode())
```

## Authorization

| Giving consent or permission.

The Authorization flow consists of a simple request-response message exchange, where the Initiator requests authorization from the Authorizer to carry out some action. It is similar to the Authentication flow in structure, however the intent of the interaction is different, and it will render differently in the Jolocom Smartwallet. Authentication is about _proving_ the Identity of an agent (e.g. SSO), while Authorization is about _giving permission or privilege_ for a service to act on an agents behalf.

#### Roles

- Authorized: Agent requesting Authorization to perform some action
- Authorizer: Agent granting Authorization to the Authorized

#### Messages

1. Authorization Request: The Authorized broadcasts a message representing the intent of the action which permission is required for.
2. Authorization Response: The Authorizer responds with a message containing the same contents as the Request as consent.

#### Examples

A simple Authorization flow between our two Agents from before looks as follows:

```typescript
const aliceAuthZRequest = await alice.authorizationRequestToken({
  description: 'Front Door',
  imageURL: 'https://example.com/lockImage.png',
  action: 'Open the door',
  callbackURL: 'https://example.com/authz/',
})

// ------- the request is received by Bob ------- //
const bobsInteraction = await bob.processJWT(aliceAuthZRequest)
const bobsAuthZResponse = await bobsInteraction.createAuthorizationResponse()

// ------- Bob's response is received by Alice ------- //
const alicesInteraction = await alice.processJWT(bobsAuthZResponse.encode())
```

## Verifiable Credential Issuance

| Creating an authenticated statement about an Identifier.

The Issuance flow consists of a three step message exchange between two parties, the Issuer and the Holder.

#### Roles

- Issuer: Agent who offers and issues one or more Verifiable Credentials
- Holder: Agent who selects and receives one or more Verifiable Credentials

#### Messages

1. Credential Offer: The Issuer broadcasts a message containing a list of credential types offered for issuance in this interaction, each with it's own list of requirements which must be satisfied by the Holder in order to qualify for the credential.
2. Credential Selection: The Holder responds with a message containing a list of selected credentials with associated data for satisfying requirements.
3. Credential Issuance: The Issuer responds with a message containing a list of newly issued credentials corrosponding to the selected set.

#### Examples

In this simple example, Alice is issuing Bob the Credential she created for him in the [Verifiable Credentials](./credentials.md) section:

```typescript
const aliceCredOffer = await alice.credentialOffer({
  callbackURL: 'https://example.com/issuance',
  offeredCredentials: [
    {
      type: 'SimpleExampleCredential',
    },
  ],
})

// ------- the offer is received by Bob ------- //
const bobsInteraction = await bob.processJWT(aliceCredOffer)
const bobsCredSelection = await bobsInteraction.createCredentialOfferResponseToken(
  [{ type: 'SimpleExampleCredential' }],
)

// ------- Bob's selection is received by Alice ------- //
const alicesInteraction = await alice.processJWT(bobsCredSelection.encode())
const alicesIssuance = await alicesInteraction.createCredentialReceiveToken(
  alicesCredAboutBob,
)

// ------- Bob Receives and stores the newly issued Credential ------- //
// Note that storage of the credential is handled automatically by the SDK
const bobReceives = await bob.processJWT(alicesIssuence.encode())
```

## Credential Verification

| Proving a set of statements about an Identifier.

The Credential Verification flow is a simple request-response message exchange between the Verifier and the Prover.

#### Roles

- Verifier: Agent who requests a set of Verifiable Credentials with associated requirements.
- Prover: Agent who provides a set of Verifiable Credentials attempting to satisfy the request

#### Messages

1. Credential Request: The Verifier broadcasts a message containing a list of credential types, each with it's own list of requirements to be satisfied by the Prover.
2. Credential Response: The Prover responds with a list of credentials which should satisfy the corrosponding requirements in the Credential Request.

#### Examples

In this example, Alice is requesting from Bob the same type of Credential she issued for him in the [Credential Issuance](#verifiable-credential-issuance) section:

```typescript
const aliceCredRequest = await alice.credentialRequestToken({
  callbackURL: 'https://example.com/request',
  credentialRequirements: [
    {
      type: ['SimpleExampleCredential'],
      constraints: [greater('age', 18), is('name', 'Bob')],
    },
  ],
})

// ------- the request is received by Bob ------- //
const bobsInteraction = await bob.processJWT(aliceAuthZRequest)
const bobsAuthZResponse = await bobsInteraction.createCredentialResponse([
  alicesCredAboutBob.id, // use the ID from the aliceCredAboutBob instance
])

// ------- Bob's response is received by Alice ------- //
const alicesInteraction = await alice.processJWT(bobsAuthZResponse.encode())
```

Note that the response argument is a list of Credential IDs. Each Credential has an ID which is a hash of the credential. The response creation will fetch each credential referenced in the list from the Agent Storage and include them in the response.
