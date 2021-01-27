import { CredentialDefinition, CredentialOffer, CredentialManifestDisplayMapping } from '@jolocom/protocol-ts'
import { jsonpath } from './util'

export interface DisplayVal {
  label?: string,
    key?: string,
    value?: string
}

// TODO actually move into jolocom-lib??
export class CredentialType {
  type: string
  def: CredentialDefinition

  constructor(type: string, def: CredentialDefinition) {
    this.type = type
    this.def = def
  }

  display(claim: any) {
    const displayVals: {
      properties?: DisplayVal | DisplayVal[]
    } = {}

    if (this.def.display) {
      Object.keys(this.def.display).forEach(k => {
        const val = this.def.display![k]
        if (Array.isArray(val)) {
          // it's the 'properties' array
          displayVals[k] = val.map(dm => this._processDisplayMapping(dm, claim))
        } else {
          // one of 'title', 'subtitle', 'description'
          displayVals[k] = this._processDisplayMapping(val, claim)
        }
      })
    }

    return {
      name: this.def.name || this.def.display?.title || this.type,
      schema: this.def.schema || '',
      ...displayVals,
      styles: {
        ...this.def.styles,
      }
    }
  }

  private _processDisplayMapping(dm: CredentialManifestDisplayMapping, claim: any) {
    let value
    const key = claim ? dm.path?.find(p => {
      // the paths are jsonpath
      value = jsonpath(p, claim)
      return value !== undefined
    }) : undefined

    return {
      label: dm.label,
      key,
      value: value || dm.text
    }
  }

  onCreateOffer(
    offer: CredentialOffer,
  ): CredentialOffer {
    const credentialDefaults = { schema: '', name: offer.type }
    return {
      ...offer,
      credential: {
        ...credentialDefaults,
        ...this.def,
        ...offer.credential,
      }
    }
  }
}
