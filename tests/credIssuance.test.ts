import { claimsMetadata } from 'jolocom-lib'
import { Agent } from '../src'
import { destroyAgent, createAgent, meetAgent } from './util'
import { CredentialOfferFlowState } from 'src/interactionManager/types'

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
  const bobsFlowState = bobRecieving.getSummary().state as CredentialOfferFlowState

  expect(bobsFlowState.credentialsAllValid).toBeTruthy()
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

  // @ts-ignore this should not be needed! but currently it mutates the state of
  // credentialsValidity
  await bobRecieving.flow.getIssuanceResult()

  // The credential validity is [true, true, false] because the last credential,
  // as per the order in the offer, is the broken mobilePhoneNumber cred
  expect(bobsFlowState.credentialsValidity).toEqual([true, true, false])
  expect(bobsFlowState.credentialsAllValid).toBeFalsy()
})
