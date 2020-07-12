import { randomBytes } from 'crypto'

export const NativeModules = { RNRandomBytes: { randomBytes } }

export class Linking {
  static async canOpenURL(url: string) {
    console.log('canOpenURL called with ' + url)
    return true
  }

  static async openURL(url: string) {
    console.log('openURL called with ' + url)
  }
}
