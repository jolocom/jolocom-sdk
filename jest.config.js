require('@jolocom/native-core')
const { pathsToModuleNameMapper } = require('ts-jest/utils')

//const { compilerOptions } = require('./tsconfig')
const compilerOptions = {
  paths: {
    // this is needed so that we can use a yarn linked sdk-storage-typeorm in
    // our tests, otherwise it imports its own sdk/lib from its node_modules
      "@jolocom/sdk": ["<rootDir>/src"],
      "jolocom-lib/*": ["<rootDir>/node_modules/jolocom-lib/*"],
  }
}
module.exports = {
  preset: 'ts-jest',
  globals: {
    'ts-jest': {
    },
  },
  moduleFileExtensions: ['ts', 'node', 'js', 'json'],
  testMatch: ['**/tests/*.test.ts'],
  testPathIgnorePatterns: ['/node_modules/.*'],
  moduleNameMapper: pathsToModuleNameMapper(
    compilerOptions.paths,
   // { prefix: '<rootDir>/' }
  )
}
