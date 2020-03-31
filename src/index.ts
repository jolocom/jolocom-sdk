import tsconfig from '../tsconfig.json'
const compilerOptions = tsconfig.compilerOptions

// @ts-ignore
const baseUrl = compilerOptions.baseUrl || '.'
// @ts-ignore
const paths = compilerOptions.paths || {}
const polyfills = [
  'src/lib/keychain',
  'rn-fetch-blob',
  'react-native',
  'src/lib/errors/sentry',
  'react-native-localize',
  'src/locales/i18n',
  'react-native-splash-screen',
  'src/lib/ipfs',
]
polyfills.forEach((p: string) => {
  paths[p] = ['src/node.polyfill.ts']
})
paths['typeorm/browser'] = ['node_modules/typeorm']

import { register } from 'tsconfig-paths'

// This will monkey patch node so that imports can support path mapping like
// typescript config does. This is used so that 'typeorm/browser' imports in the
// storage lib code get mapped to 'typeorm' directly (for node usage)
register({
  paths,
  baseUrl,
})

import { initStore } from 'src/node.polyfill'
import * as entities from 'src/lib/storage/entities'
import * as actions from 'src/actions'

export { initStore, entities, actions }
