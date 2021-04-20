import { createConnection, getConnection, ConnectionOptions } from 'typeorm'

import { JolocomTypeormStorage } from '@jolocom/sdk-storage-typeorm'

import { Agent, JolocomSDK, NaivePasswordStore } from '../src'
import { CredentialOfferFlow } from '../src/interactionManager/credentialOfferFlow'

const defaultAgentName = 'j'
const defaultDidMethodName = 'jun'

export async function createAgent(
  name = defaultAgentName,
  didMethodName = defaultDidMethodName,
  pass?: string,
) {
  const sdk = await getSdk(name)

  const didMethod = sdk.didMethods.get(didMethodName)
  const passwordStore = pass
    ? { getPassword: async () => pass }
    : new NaivePasswordStore()
  const agent = new Agent({
    sdk,
    passwordStore,
    didMethod,
  })
  return agent
}

export async function destroyAgent(name = defaultAgentName) {
  const conn = getConnection(name)
  return conn.close()
}

export const getConnectionConfig = (name: string) => ({
  name,
  type: 'sqlite',
  database: ':memory:',
  //database: `./${name}.test.db.sqlite3`, // to save the test databases
  dropSchema: true,
  entities: ['node_modules/@jolocom/sdk-storage-typeorm/js/src/entities/*.js'],
  synchronize: true,
  logging: false,
})

export const getSdk = async (name: string) => {
  const connConfig = getConnectionConfig(name) as ConnectionOptions
  const conn = await createConnection(connConfig)
  return new JolocomSDK({
    storage: new JolocomTypeormStorage(conn),
  })
}

/**
 * Allow alice to resolve bob
 */
export async function meetAgent(alice: Agent, bob: Agent, both = true) {
  const bobId = bob.idw.did.split(':')[2]
  const bobEL = await bob.storage.eventDB.read(bobId)

  await alice.didMethod.registrar.encounter(bobEL)

  if (both) await meetAgent(bob, alice, false)
}

export async function basicCredOffer(
  issuer: Agent,
  holder: Agent,
  creds = [{ type: 'dummy' }, { type: 'anotherdummy' }]
) {
  const credOffer = await issuer.credOfferToken({
    callbackURL: '',
    offeredCredentials: creds,
  })
  const bobInterxn = await holder.processJWT(credOffer.encode())
  const bobResponse = await bobInterxn.createCredentialOfferResponseToken(
    creds,
  )
  await holder.processJWT(bobResponse)
  const aliceInteraction = await issuer.processJWT(bobResponse)

  const aliceIssuance = await aliceInteraction.createCredentialReceiveToken(
    await Promise.all(creds.map(cred => {
      return issuer.credentials.issue({
        metadata: {
          type: ['VerifiableCredential', cred.type],
          name: cred.type,
          context: [],
        },
        subject: holder.idw.did,
        claim: {
          givenName: 'Bob',
          familyName: 'Agent',
        },
      })
    }))
  )

  const bobRecieving = await holder.processJWT(aliceIssuance)

  let interxns = await issuer.sdk.storage.get.interactionIds()
  expect(interxns).toHaveLength(1)
  const bobsFlow = bobRecieving.flow as CredentialOfferFlow
  expect(bobsFlow.state.credentialsAllValid).toBeTruthy()
  await bobInterxn.storeSelectedCredentials()
}
