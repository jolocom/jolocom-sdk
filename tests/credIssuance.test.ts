import { claimsMetadata } from 'jolocom-lib'
import { Agent } from '../src'
import { destroyAgent, createAgent, meetAgent } from './util'
import { CredentialOfferFlowState } from 'src/interactionManager/types'
import { CredentialOfferFlow } from 'src/interactionManager/credentialOfferFlow'

const conn1Name = 'issuance1'
const conn2Name = 'issuance2'

let alice: Agent, bob: Agent
beforeEach(async () => {
  alice = await createAgent(conn1Name, 'jun')
  await alice.createNewIdentity()

  bob = await createAgent(conn2Name, 'jun')
  await bob.createNewIdentity()
})

afterEach(async () => {
  await destroyAgent(conn1Name)
  await destroyAgent(conn2Name)
})

test('Credential Issuance interaction', async () => {
  // making alice resolvable by bob
  await meetAgent(bob, alice, false)
  // ensure alice is resolvable by bob
  await expect(bob.resolve(alice.idw.did)).resolves.toMatchObject(
    Promise.resolve(alice.idw.didDocument.toJSON()),
  )

  const aliceCredOffer = await alice.credOfferToken({
    callbackURL: 'nowhere',
    offeredCredentials: [
      {
        type: claimsMetadata.name.type[1],
      },
    ],
  })

  const bobInteraction = await bob.processJWT(aliceCredOffer.encode())

  const bobResponse = (
    await bobInteraction.createCredentialOfferResponseToken([
      { type: claimsMetadata.name.type[1] },
    ])
  ).encode()
  await bob.processJWT(bobResponse)

  const aliceInteraction = await alice.processJWT(bobResponse)

  const aliceIssuance = await aliceInteraction.createCredentialReceiveToken([
    await alice.signedCredential({
      metadata: claimsMetadata.name,
      subject: bob.idw.did,
      claim: {
        givenName: 'Bob',
        familyName: 'Agent',
      },
    }),
  ])

  const bobRecieving = await bob.processJWT(aliceIssuance.encode())
  const bobsFlow = bobRecieving.flow as CredentialOfferFlow
  expect(bobsFlow.state.credentialsAllValid).toBeTruthy()

  const issuanceResult = bobsFlow.getIssuanceResult()
  expect(issuanceResult).toHaveLength(1)
  expect(issuanceResult[0].validationErrors).toMatchObject({
    invalidIssuer: false,
    invalidSubject: false
  })
})

test('Credential Issuance interaction, with out of order selection and invalid credential', async () => {
  // making alice resolvable by bob
  await meetAgent(bob, alice, false)
  // ensure alice is resolvable by bob
  await expect(bob.resolve(alice.idw.did)).resolves.toMatchObject(
    Promise.resolve(alice.idw.didDocument.toJSON()),
  )

  // The credential offer is created with these creds offered in this order
  const credTypes = ['name', 'emailAddress', 'mobilePhoneNumber']
  const aliceCredOffer = await alice.credOfferToken({
    callbackURL: 'nowhere',
    offeredCredentials: credTypes.map(t => {
      return {
        type: claimsMetadata[t].type[1],
      }
    })
  })

  const bobInteraction = await bob.processJWT(aliceCredOffer.encode())

  // Bob makes a response with the selection being in a different order than the
  // offer
  const bobResponse = (await bobInteraction.createCredentialOfferResponseToken(
    [2, 1, 0].map(i => {
      return { type: claimsMetadata[credTypes[i]].type[1] }
    })
  )).encode()
  await bob.processJWT(bobResponse)

  const aliceInteraction = await alice.processJWT(bobResponse)
  // Alice issues the credentials, but the mobilePhoneNumber credential has an
  // invalid subject
  const aliceIssuanceCreds = await aliceInteraction.issueSelectedCredentials({
    [claimsMetadata.name.type[1]]: async (inp?: any) => {
      return {
        claim: {
          message: 'test'
        },
        metadata: claimsMetadata.name
      }
    },
    [claimsMetadata.emailAddress.type[1]]: async (inp?: any) => {
      return {
        claim: {
          message: 'test'
        },
        metadata: claimsMetadata.emailAddress
      }
    },
    [claimsMetadata.mobilePhoneNumber.type[1]]: async (inp?: any) => {
      return {
        subject: 'did:is:INVALID',
        claim: {
          message: 'test'
        },
        metadata: claimsMetadata.mobilePhoneNumber
      }
    }
  })

  const aliceIssuance = await aliceInteraction.createCredentialReceiveToken(
    aliceIssuanceCreds
  )

  // Bob receives the issued credentials
  const bobRecieving = await bob.processJWT(aliceIssuance.encode())
  const bobsFlowState = bobRecieving.getSummary().state as CredentialOfferFlowState

  // The credential validity is [true, true, false] because the last credential,
  // as per the order in the offer, is the broken mobilePhoneNumber cred
  expect(bobsFlowState.credentialsValidity).toEqual([true, true, false])
  expect(bobsFlowState.credentialsAllValid).toBeFalsy()
})

test('Credential Issuance interaction, with only subset selected', async () => {
  // making alice resolvable by bob
  await meetAgent(bob, alice, false)
  // ensure alice is resolvable by bob
  await expect(bob.resolve(alice.idw.did)).resolves.toMatchObject(
    Promise.resolve(alice.idw.didDocument.toJSON()),
  )

  // The credential offer is created with these creds offered in this order
  const credTypes = ['name', 'emailAddress', 'mobilePhoneNumber']
  const aliceCredOffer = await alice.credOfferToken({
    callbackURL: 'nowhere',
    offeredCredentials: credTypes.map(t => {
      return {
        type: claimsMetadata[t].type[1],
      }
    })
  })

  const bobInteraction = await bob.processJWT(aliceCredOffer.encode())

  // Bob makes a response with the selection being in a different order than the
  // offer
  const bobResponse = (await bobInteraction.createCredentialOfferResponseToken([
    { type: claimsMetadata.emailAddress.type[1] }
  ])).encode()
  await bob.processJWT(bobResponse)

  const aliceInteraction = await alice.processJWT(bobResponse)
  // Alice issues the credentials, but the mobilePhoneNumber credential has an
  // invalid subject
  const aliceIssuanceCreds = await aliceInteraction.issueSelectedCredentials({
    [claimsMetadata.name.type[1]]: async (inp?: any) => {
      return {
        claim: {
          message: 'test'
        },
        metadata: claimsMetadata.name
      }
    },
    [claimsMetadata.emailAddress.type[1]]: async (inp?: any) => {
      return {
        claim: {
          message: 'test'
        },
        metadata: claimsMetadata.emailAddress
      }
    },
    [claimsMetadata.mobilePhoneNumber.type[1]]: async (inp?: any) => {
      return {
        subject: 'did:is:INVALID',
        claim: {
          message: 'test'
        },
        metadata: claimsMetadata.mobilePhoneNumber
      }
    }
  })

  const aliceIssuance = await aliceInteraction.createCredentialReceiveToken(
    aliceIssuanceCreds
  )
  await aliceInteraction.processInteractionToken(aliceIssuance)
  const alicesFlowState = aliceInteraction.flow.state as CredentialOfferFlowState

  // Bob receives the issued credentials
  const bobRecieving = await bob.processJWT(aliceIssuance.encode())
  const bobsFlow = bobRecieving.flow as CredentialOfferFlow

  expect(bobsFlow.state.credentialsValidity).toEqual([true])
  expect(bobsFlow.state.credentialsAllValid).toBeTruthy()
  expect(bobsFlow.state.issued).toHaveLength(1)
  expect(alicesFlowState.issued).toHaveLength(1)
  expect(alicesFlowState.selectedTypes).toEqual([claimsMetadata.emailAddress.type[1]])
  expect(bobsFlow.getSelectionResult()).toEqual(alicesFlowState.selectedTypes)
})
