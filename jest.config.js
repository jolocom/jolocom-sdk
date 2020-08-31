require('@jolocom/native-core')
module.exports = {
  preset: 'ts-jest',
  globals: {
    'ts-jest': {
    },
  },
  moduleFileExtensions: ['ts', 'node', 'js', 'json'],
  testMatch: ['**/tests/*.test.ts'],
  testPathIgnorePatterns: ['/node_modules/.*']
}
