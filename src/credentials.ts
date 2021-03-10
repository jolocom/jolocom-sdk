import {
  CredentialDefinition,
  CredentialOffer,
  CredentialManifestDisplayMapping,
  ClaimEntry,
} from "@jolocom/protocol-ts"
import { jsonpath } from "./util"

export interface DisplayVal {
  label?: string
  key?: string
  value?: string
}

export interface CredentialDisplay {
  name: string
  schema: string
  styles: CredentialDefinition["styles"]
  display: {
    properties: DisplayVal[]
    title?: DisplayVal
    subtitle?: DisplayVal
    description?: DisplayVal
  }
}

// TODO actually move into jolocom-lib??
export class CredentialType {
  type: string
  def: CredentialDefinition

  constructor(type: string, def: CredentialDefinition) {
    this.type = type
    this.def = def
  }

  display(claim: ClaimEntry): CredentialDisplay {
    const display: CredentialDisplay['display'] = {
      properties: []
    }

    if (this.def.display) {
      Object.keys(this.def.display).forEach((k) => {
        const val = this.def.display![k]
        if (Array.isArray(val)) {
          // it's the 'properties' array
          display[k] = val.map((dm) =>
            this._processDisplayMapping(dm, claim)
          )
        } else {
          // one of 'title', 'subtitle', 'description'
          display[k] = this._processDisplayMapping(val, claim)
        }
      })
    }

    return {
      name: this.def.name || this.type,
      schema: this.def.schema || "",
      display: display,
      styles: {
        ...this.def.styles,
      },
    }
  }

  private _processDisplayMapping(
    dm: CredentialManifestDisplayMapping,
    claim: any
  ) {
    let value
    const key = claim
      ? dm.path?.find((p) => {
          // the paths are jsonpath
          value = jsonpath(p, claim)
          return value !== undefined
        })
      : undefined

    return {
      label: dm.label,
      key,
      value: value !== undefined ? value : dm.text,
    }
  }

  onCreateOffer(offer: CredentialOffer): CredentialOffer {
    const credentialDefaults = { schema: "", name: offer.type }
    return {
      ...offer,
      credential: {
        ...credentialDefaults,
        ...this.def,
        ...offer.credential,
      },
    }
  }
}
