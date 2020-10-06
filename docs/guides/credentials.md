# Verifiable Credentials

[Verifiable Credentials](https://www.w3.org/TR/vc-data-model/) represent information that one Identifier is asserting to be true about another Identifier. These statements are authenticated by verifying the signatures made on them by the issuer. Credentials can be created by Agents. Because they have a structured semantic meaning, each Verifiable Credential type must be defined in terms of a context. This is important, else the term will not appear in the signed data and will not be secured by the proof. This context is a mapping of terms found in the Credential to URIs which represent the meaning of the term. An example Credential creation is as follows, note that the `simpleExampleCredMetadata` constitutes the definition of the Credential type and should be re-used:

```typescript
const simpleExampleCredMetadata = {
  type: ['Credential', 'SimpleExampleCredential'],
  name: 'Example Name and Age',
  context: [
    {
      SimpleExample: 'https://example.com/terms/SimpleExampleCredential',
      schema: 'https://schema.org/',
      age: 'schema:age',
      name: 'schema:name',
    },
  ],
}

const alicesCredAboutBob = await alice.signedCredential({
  metadata: simpleExampleCredMetadata,
  subject: bobsDID,
  claim: {
    age: 25,
    name: 'Bob',
  },
})
```

In this simple example, one of our Agents (Alice) is creates a credential with Bob as the subject, stating that his age is 25 and that his name is Bob. For details on how to actually transfer this credential from Alice to Bob (Issuance) or make use of the credential (Verification), see the [Credential Issuance](./interaction_flows.md#verifiable-credential-issuance) and [Credential Verification](./interaction_flows.md#credential-verification) sections. For detailed documentation on defining Verifiable Credential types, see the [Credentials](https://jolocom-lib.readthedocs.io/en/latest/signedCredentials.html) section of the Jolocom Library documentation.
