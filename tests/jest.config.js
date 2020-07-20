module.exports = {
  preset: 'ts-jest',
  globals: {
    'ts-jest': {
    },
  },
  moduleFileExtensions: ['ts', 'node', 'js', 'json'],
  testMatch: ['./**/*.ts'],
  testPathIgnorePatterns: ['/node_modules/.*']
}
