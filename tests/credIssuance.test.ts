import { ClaimMimeType } from '@jolocom/protocol-ts'
import { claimsMetadata } from 'jolocom-lib'
import { SignedCredential } from 'jolocom-lib/js/credentials/signedCredential/signedCredential'
import { CredentialOfferFlow } from 'src/interactionManager/credentialOfferFlow'
import { CredentialOfferFlowState } from 'src/interactionManager/types'
import { Agent } from '../src'
import {
  createAgent,
  destroyAgent,
  meetAgent,
  testConsoleThenReturnValue,
} from './util'

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

describe('Credential Issuance interaction', () => {
  test('will create and save', async () => {
    // making alice resolvable by bob
    await meetAgent(bob, alice, false)
    // ensure alice is resolvable by bob
    await expect(bob.resolve(alice.idw.did)).resolves.toMatchObject(
      Promise.resolve(alice.idw.didDocument.toJSON()),
    )

    const credDesc = {
      schema: 'https://schema.org/example',
      name: 'Test Credential',
      claimSchema: {
        test: { type: 'string', title: 'Test Name' },
        testStatus: {
          type: 'boolean',
          title: 'Test Status',
          description: 'Whether the test was successful',
        },
      },
    }

    const jsonSchemaToDisplayMappings = (schema: any) => {
      const props = (schema && schema.properties) || schema
      return Object.keys(props).map(key => {
        const subSchema = props[key]
        return {
          label: subSchema.title,
          path: [`$.${key}`],
          // eslint-disable-next-line @typescript-eslint/camelcase
          mime_type: ClaimMimeType.text_plain,
          preview: false,
          ...(subSchema.description !== undefined && {
            text: subSchema.description,
          }),
        }
      })
    }

    const aliceCredOffer = await alice.credOfferToken({
      callbackURL: 'nowhere',
      offeredCredentials: [
        {
          type: claimsMetadata.name.type[1],
          credential: {
            schema: credDesc.schema,
            name: credDesc.name,
            display: {
              properties: jsonSchemaToDisplayMappings(credDesc.claimSchema),
            },
          },
        },
      ],
    })

    const bobInteraction = await bob.processJWT(aliceCredOffer.encode())
    expect(() => bobInteraction.transportAPI).not.toThrow()

    const flow = bobInteraction.flow as CredentialOfferFlow
    const creds = flow.getOfferDisplay()
    expect(creds[0].name).toEqual(credDesc.name)
    expect(creds[0].display.properties).toHaveLength(2)
    const props = creds[0].display.properties
    expect(props && props[0].label).toEqual(credDesc.claimSchema.test.title)

    const bobResponse = (
      await bobInteraction.createCredentialOfferResponseToken([
        { type: claimsMetadata.name.type[1] },
      ])
    ).encode()
    await bob.processJWT(bobResponse)

    const aliceInteraction = await alice.processJWT(bobResponse)
    const aliceIssuance = await aliceInteraction.createCredentialReceiveToken([
      (await testConsoleThenReturnValue({
        channel: 'warn',
        callback: async () =>
          await alice.credentials.create({
            metadata: claimsMetadata.name,
            subject: bob.idw.did,
            claim: {
              givenName: 'Bob',
              familyName: 'Agent',
            },
          }),
        expectedInvokeTimes: 1,
        expectedMessage:
          'Credential persistence. Only self-signed credentials can be stored.',
      })) as SignedCredential,
    ])

    const bobRecieving = await bob.processJWT(aliceIssuance)
    const bobsFlow = bobRecieving.flow as CredentialOfferFlow
    expect(bobsFlow.state.credentialsAllValid).toBeTruthy()

    const issuanceResult = bobsFlow.getIssuanceResult()
    expect(issuanceResult).toHaveLength(1)
    expect(issuanceResult[0].validationErrors).toMatchObject({
      invalidIssuer: false,
      invalidSubject: false,
    })
    await expect(bob.credentials.query()).resolves.toHaveLength(0)
    await bobRecieving.storeSelectedCredentials()
    await expect(bob.credentials.query()).resolves.toHaveLength(1)
  })

  test('with out of order selection and invalid credential', async () => {
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
      offeredCredentials: credTypes.map(t => ({
        type: claimsMetadata[t].type[1],
      })),
    })

    const bobInteraction = await bob.processJWT(aliceCredOffer.encode())

    // Bob makes a response with the selection being in a different order than the
    // offer
    const bobResponse = (
      await bobInteraction.createCredentialOfferResponseToken(
        [2, 1, 0].map(i => ({ type: claimsMetadata[credTypes[i]].type[1] })),
      )
    ).encode()
    await bob.processJWT(bobResponse)

    const aliceInteraction = await alice.processJWT(bobResponse)
    // Alice issues the credentials, but the mobilePhoneNumber credential has an
    // invalid subject
    const aliceIssuanceCreds = await aliceInteraction.issueSelectedCredentials({
      [claimsMetadata.name.type[1]]: async () => ({
        claim: {
          message: 'test',
        },
        metadata: claimsMetadata.name,
      }),
      [claimsMetadata.emailAddress.type[1]]: async () => ({
        claim: {
          message: 'test',
        },
        metadata: claimsMetadata.emailAddress,
      }),
      [claimsMetadata.mobilePhoneNumber.type[1]]: async () => ({
        subject: 'did:is:INVALID',
        claim: {
          message: 'test',
        },
        metadata: claimsMetadata.mobilePhoneNumber,
      }),
    })

    const aliceIssuance = await aliceInteraction.createCredentialReceiveToken(
      aliceIssuanceCreds,
    )

    // Bob receives the issued credentials
    const bobRecieving = await bob.processJWT(aliceIssuance.encode())
    const bobsFlowState = bobRecieving.getSummary()
      .state as CredentialOfferFlowState

    // The credential validity is [true, true, false] because the last credential,
    // as per the order in the offer, is the broken mobilePhoneNumber cred
    expect(bobsFlowState.credentialsValidity).toEqual([true, true, false])
    expect(bobsFlowState.credentialsAllValid).toBeFalsy()
  })

  test('with only subset selected', async () => {
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
      offeredCredentials: credTypes.map(t => ({
        type: claimsMetadata[t].type[1],
      })),
    })

    const bobInteraction = await bob.processJWT(aliceCredOffer.encode())

    // Bob makes a response with the selection being in a different order than the
    // offer
    const bobResponse = (
      await bobInteraction.createCredentialOfferResponseToken([
        { type: claimsMetadata.emailAddress.type[1] },
      ])
    ).encode()
    await bob.processJWT(bobResponse)

    const aliceInteraction = await alice.processJWT(bobResponse)
    // Alice issues the credentials, but the mobilePhoneNumber credential has an
    // invalid subject
    const aliceIssuanceCreds = await aliceInteraction.issueSelectedCredentials({
      [claimsMetadata.name.type[1]]: async () => ({
        claim: {
          message: 'test',
        },
        metadata: claimsMetadata.name,
      }),
      [claimsMetadata.emailAddress.type[1]]: async () => ({
        claim: {
          message: 'test',
        },
        metadata: claimsMetadata.emailAddress,
      }),
      [claimsMetadata.mobilePhoneNumber.type[1]]: async () => ({
        subject: 'did:is:INVALID',
        claim: {
          message: 'test',
        },
        metadata: claimsMetadata.mobilePhoneNumber,
      }),
    })

    const aliceIssuance = await aliceInteraction.createCredentialReceiveToken(
      aliceIssuanceCreds,
    )
    await aliceInteraction.processInteractionToken(aliceIssuance)
    const alicesFlowState = aliceInteraction.flow
      .state as CredentialOfferFlowState

    // Bob receives the issued credentials
    const bobRecieving = await bob.processJWT(aliceIssuance.encode())
    const bobsFlow = bobRecieving.flow as CredentialOfferFlow

    expect(bobsFlow.state.credentialsValidity).toEqual([true])
    expect(bobsFlow.state.credentialsAllValid).toBeTruthy()
    expect(bobsFlow.state.issued).toHaveLength(1)
    expect(alicesFlowState.issued).toHaveLength(1)
    expect(alicesFlowState.selectedTypes).toEqual([
      claimsMetadata.emailAddress.type[1],
    ])
    expect(bobsFlow.getSelectionResult()).toEqual(alicesFlowState.selectedTypes)
  })

  const claimNullValueThrowDataProvider = () => [
    {
      claim: {
        givenName: null,
      },
    },
    {
      claim: {
        givenName: null,
        familyName: null,
      },
    },
    {
      claim: {
        givenName: 'Bob',
        familyName: null,
      },
    },
    {
      claim: {
        givenName: null,
        fullName: 'Agent',
      },
    },
  ]

  const createInteractionForNullPropertyValueCheck = async (
    alice: Agent,
    bob: Agent,
  ) => {
    const aliceCredOffer = await alice.credOfferToken({
      callbackURL: 'nowhere',
      offeredCredentials: [{ type: claimsMetadata['name'].type[1] }],
    })
    const bobInteraction = await bob.processJWT(aliceCredOffer.encode())
    const bobResponse = (
      await bobInteraction.createCredentialOfferResponseToken([
        { type: claimsMetadata.name.type[1] },
      ])
    ).encode()

    await bob.processJWT(bobResponse)

    return await alice.processJWT(bobResponse)
  }

  test.each(claimNullValueThrowDataProvider())(
    'with %o that have null value will throw',
    async claim => {
      // making alice resolvable by bob
      await meetAgent(bob, alice, false)
      // ensure alice is resolvable by bob
      await expect(bob.resolve(alice.idw.did)).resolves.toMatchObject(
        Promise.resolve(alice.idw.didDocument.toJSON()),
      )

      const interaction = await createInteractionForNullPropertyValueCheck(
        alice,
        bob,
      )
      const issuanceCredentials = async () =>
        await interaction.issueSelectedCredentials({
          ProofOfNameCredential: async () => ({
            metadata: claimsMetadata.name,
            subject: bob.idw.did,
            ...claim,
          }),
        })

      await expect(issuanceCredentials()).rejects.toThrow()
    },
  )

  test('with claim that have valid value will not throw', async () => {
    // making alice resolvable by bob
    await meetAgent(bob, alice, false)
    // ensure alice is resolvable by bob
    await expect(bob.resolve(alice.idw.did)).resolves.toMatchObject(
      Promise.resolve(alice.idw.didDocument.toJSON()),
    )

    const interaction = await createInteractionForNullPropertyValueCheck(
      alice,
      bob,
    )
    const issuanceCredentials = async () =>
      await interaction.issueSelectedCredentials({
        ProofOfNameCredential: async () => ({
          metadata: claimsMetadata.name,
          subject: bob.idw.did,
          claim: {
            givenName: 'Bob',
            fullName: 'Agent',
          },
        }),
      })

    await expect(issuanceCredentials()).resolves.not.toThrow()
  })
})
