# Channels

Channels are authenticated long running connections established between two
Agents. Once established, a channel can be used to start one or more
[Interactions](../interaction_flows)

To establish a channel, two agents must first go through an
`EstablishChannelFlow` successfully. This consists of a request and a response.

## Request

The request consists of a description (purpose) of the channel, and a list of
possible transports to use for the channel. One agent, alice, prepares this
request and sends it to another agent, bob.

```typescript
// after creating an agent, alice (refer to introduction)
import { ChannelTransportType } from '@jolocom/sdk'

const establishChToken = await alice.establishChannelRequestToken({
  description: 'test channel',
  transports: [
    {
      type: ChannelTransportType.WebSockets,
      config: 'ws://localhost:9000',
    },
  ],
})
```

Currently only one transport type, WebSockets, is supported for creating
channels, but this can be extended by defining new transports, as long as both
agents are configured to support them.

The initial establish channel request must be propagated to the counterparty
in some application-specific manner (QR code, backend request, etc).

Currently, the application is also expected to externally create a websocket
server and generate the correct URL (passed in `config`) in the channel
establishment request. An example of how to do this can be found at
[https://github.com/jolocom/web-service-base](https://github.com/jolocom/web-service-base)

## Response

The response is simply a selection of which transport will be used. The response
token is created then sent over the channel as soon as the transport is open.

So on bob's end:

```typescript
// bob receives the token (app specific), processes it to get a new interaction
const bobInterxn = bob.processJWT(establishChToken.encode())

// inspect the transport options
import { EstablishChannelFlowState } from '@jolocom/sdk/js/interactionManager/types'
const flowState = bobInterxn.getSummary().state as EstablishChannelFlowState
console.log(flowState.transports)

// create a response selecting the transport at index 0
const establishResp = await bobInterxn.createEstablishChannelResponse(0)
// process the response locally to update our own interaction state
await bobInterxn.processInteractionToken(establishResp.encode())
```

Now bob's interaction state is up to date, and they must open the channel. Note
that the WebSocket transport needs to be configured prior to use, please refer
to the [configuration guide](../sdk_install_conf)

```typescript
// create a channel based on this interaction
const bobCh = await sdk.channels.create(bobInterxn)

// "start" the channel, by giving it an interaction callback, to be called
// when new interactions get created from a request coming in on the channel
await bobCh.start(async interxn => {
  // do something with the incoming interaction
  // then use interxn.send
  interxn.send(responseToken)
})

// once start returns (async), the transport is active, and the first message
```

Finally, now that the transport is open, bob needs to send the channel
establishment response to alice, as the first message on this (unauthenticated)
channel.

```typescript
// sent should be the response to the establish channel request
await bobCh.send(establishResp)
```

Once alice receives this message and validates it, the channel is considered
established.

## Using the Channel

Now that the channel is established, further interactions can happen on it using
the `startThread` method:

```typescript
const authRequest = await alice.authRequest({
  callbackURL: '', // can be left empty because
  // we will use the pre-established channel
  description: 'are you bob?',
})

const response = await ch.startThread(authRequest)
// 'response' is the token that was received as a response
// it has already been processed, no need to process it
```
