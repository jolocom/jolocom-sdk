module.exports = {
  preset: 'ts-jest',
  setupFiles: ['./tests/utils/setup.ts'],
  globals: {
    'ts-jest': {
      babelConfig: true,
    },
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  moduleNameMapper: {
    'src/lib/keychain': '<rootDir>/src/node.polyfill',
    'src/lib/errors/sentry': '<rootDir>/src/node.polyfill',
    'src/locales/i18n': '<rootDir>/src/node.polyfill',
    'src/lib/ipfs': '<rootDir>/src/node.polyfill',
  },
  moduleDirectories: ['node_modules', '<rootDir>'],
  testMatch: ['**/tests/**/*.test.[tj]s?(x)'],
  testPathIgnorePatterns: ['/node_modules/.*', '/legacy/.*'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
}
