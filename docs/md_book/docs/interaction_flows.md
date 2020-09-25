# Interaction Flows

Each interaction consists of a set of Agents and the set of messages which have been exchanged between them, as well as a set of invariants which is defined by that particular interaction type. For example, a Credential Request interaction has two participants:

- Verifier: requests a set of Credentials from the Prover and verifies them
- Prover: provides the credentials to the Verifier

As well as two possible message types:

- Credential Request
- Credential Response

And two invariants:

- The Credentials listed in the Credential Response MUST fulfill the requirements listed in the Credential Request
- The Credentials listed in the Credential Response MUST have valid signatures

## Authentication

| Proving control over an Identifier.

The Authentication flow consists of a simple request-response message exchange, where the contents of the response must match those of the request. Because all Messages are signed and authenticated, the response functions as proof of control by nature of being correctly signed by the keys listed in the DID Document of the issuer.

A simple Authentication flow between two Agents looks as follows:

```typescript
const alice = new JolocomSDK(optionsForAlice)
await alice.init()

const bob = new JolocomSDK(optionsForBob)
await bob.init()

// Alice would like to know that Bob is indeed Bob
// so she asks him!
const authRequest = await alice.authRequest({
  callbackURL: myCallbackURL,
  description: 'are you bob?',
})

// Bob hears her ask
const bobsInteraction = await bob.processJWT(authRequest)

// and decides to respond to her question
const bobsAuthResponse = await bobsInteraction.createAuthenticationResponse()

// Alice hears his answer, and knows that he is indeed Bob!
const alicesInteraction = await alice.processJWT(bobsAuthResponse.encode())
```

## Authorization

| Giving consent or permission.

The Authorization flow consists of a simple request-response message exchange, where the Initiator requests authorization from the Authorizer to carry out some action.

## Verifiable Credential Issuance

## Verifiable Credential Request
