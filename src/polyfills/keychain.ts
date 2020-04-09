import { writeFileSync, readFileSync } from 'fs'
import path from 'path'

// from src/lib/keychain.ts
export class KeyChain implements KeyChainInterface {
  static PASSWORD_LOCATION = path.resolve(
    `${__dirname}/../local_identity.password.txt`,
  )
  private pass: string | null = null

  public async getPassword() {
    if (this.pass != null) return this.pass
    try {
      this.pass = readFileSync(KeyChain.PASSWORD_LOCATION).toString()
    } catch (err) {
      console.error('Error reading password file', err, '\n\n')
      throw err
    }

    return this.pass
  }

  public async savePassword(pass: string) {
    console.log('KEYCHAIN SAVED PASSWORD: ', pass)
    this.pass = pass
    writeFileSync(KeyChain.PASSWORD_LOCATION, pass)
  }
}

export interface KeyChainInterface {
  savePassword: (password: string) => Promise<void>
  getPassword: () => Promise<string>
}
