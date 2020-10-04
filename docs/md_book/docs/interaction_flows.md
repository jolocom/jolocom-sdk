# Interaction Flows

Each interaction is defined by:

- The Roles played by Agents participating in the interaction
- The set of message types associated with the type of interaction
- The set of rules associated with the type of interaction which determine the validity of new messages given the previous messages

## Peer Resolution

| Using another Agent as a Resolver

Peer resolution consists of a simple request-response message exchange, where the Requester asks the Resolver to perform DID resolution and return the result:

1. Resolution Request: The Requester broadcasts a message which may or may not contain a DID.
2. Resolution Result: If the message contains a DID, the Resolver resolves the DID and returns the [DID Resolution Result](https://w3c-ccg.github.io/did-resolution/#did-resolution-result). Otherwise, the Resolver returns the result of resolving it's own DID. This is intended for the special case of "local" DID methods, which do not have a globally resolvable state.

Peer resolution allows for the resolution of Identifiers which rely on a local state proof (e.g. KERI and `did:peer`) instead of a globally resolvable state. The successful result of resolving such Identifiers is cached by default by the SDK, and they are resolvable by any Agent instance which shares the same EventDB. Think of such a protocol as an "introduction" or "onboarding" of a private DID into a backend system.

A simple Peer Resolution flow between two Agents looks as follows:

```typescript
const aliceResRequest = await alice.createResolutionRequest({
  description: 'introduce yourself',
  callbackURL: 'https://example.com/onboarding',
}) // no 'uri' indicates that the responder should resolve their own DID

const bobsInteraction = await bob.processJWT(aliceResRequest)

const bobsResResponse = await bobsInteraction.createResolutionResponse()

// this adds Bob's identity data (a Key Event Log) to Alice's storage, such that she can resolve his DID and verify signatures made by him
const alicesInteraction = await alice.processJWT(bobsResResponse.encode())
```

Services which are intended for consumption by natural persons are encouraged to provide at least one method for Agents to resolve themselves using this flow, as these "local" Identifiers are designed to solve critical GDPR and User privacy issues affecting DID methods which rely on a global shared state like Blockchains.

## Authentication

| Proving control over an Identifier.

The Authentication flow consists of a simple request-response message exchange, where the contents of the response must match those of the request. Because all Messages are signed and authenticated, the response functions as proof of control by nature of being correctly signed by the keys listed in the DID Document of the issuer. Because of this, in scenarios where a more complex functionality (e.g. Credential Verification) is needed, an additional Authentication flow is not necessary.

A simple Authentication flow between our two Agents looks as follows:

```typescript
const authRequest = await alice.authRequest({
  callbackURL: myCallbackURL,
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

A simple Authorization flow between our two Agents from before looks as follows:

```typescript
const aliceAuthZRequest = await alice.authorizationRequestToken({
  description: 'Front Door',
  imageURL: 'https://example.com/lockImage.png',
  action: 'Open the door',
  callbackURL: 'https://example.com/authz/',
})

const bobsInteraction = await bob.processJWT(aliceAuthZRequest)

const bobsAuthZResponse = await bobsInteraction.createAuthorizationResponse()

const alicesInteraction = await alice.processJWT(bobsAuthZResponse.encode())
```

## Credential Verification

| Proving a set of statements about an Identifier.

The Credential Verification flow is a simple request-response message exchange between the Verifier and the Prover:

1. Credential Request: The Verifier broadcasts a message containing a list of credential types, each with it's own list of requirements to be satisfied by the Prover.
2. Credential Response: The Prover responds with a list of credentials which should satisfy the corrosponding requirements in the Credential Request.

A common use case of the Credential Request flow is securing an API in a similar fashion to Open ID Connect (OIDC).

## Verifiable Credential Issuance

| Creating an authenticated statement about an Identifier.

The Issuance flow consists of a three step message exchange between two parties, the Issuer and the Holder:

1. Credential Offer: The Issuer broadcasts a message containing a list of credential types offered for issuance in this interaction, each with it's own list of requirements which must be satisfied by the Holder in order to qualify for the credential.
2. Credential Selection: The Holder responds with a message containing a list of selected credentials with associated data for satisfying requirements.
3. Credential Issuance: The Issuer responds with a message containing a list of newly issued credentials corrosponding to the selected set.
