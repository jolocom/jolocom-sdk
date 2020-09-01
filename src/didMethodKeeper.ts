import { didMethods } from 'jolocom-lib/js/didMethods'
import { IDidMethod } from 'jolocom-lib/js/didMethods/types'

export class DidMethodKeeper {
  methods: { [k: string]: IDidMethod } = {}
  private _defaultMethod: IDidMethod

  constructor(defaultMethod = didMethods.jolo) {
    this._defaultMethod = defaultMethod
    this.methods[defaultMethod.prefix] = defaultMethod
  }

  register(methodName: string, implementation: IDidMethod) {
    if (this.methods[methodName]) {
      throw new Error('DID method "' + methodName + '" already registered')
    }

    this.methods[methodName] = implementation
  }

  get(methodName: string) {
    const method = this.methods[methodName]
    if (!method) {
      throw new Error('no did method "' + methodName + '" registered!')
    }
    return method
  }

  getForDid(did: string) {
    const methodName = did.split(':')[1]
    if (!methodName) throw new Error('could not parse DID: ' + did)
    return this.get(methodName)
  }

  setDefault(method: IDidMethod) {
    this._defaultMethod = method
  }

  getDefault() {
    return this._defaultMethod
  }
}
