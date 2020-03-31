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
    'src/lib/keychain': 'src/node.polyfill.ts',
    'rn-fetch-blob': 'src/node.polyfill.ts',
    'react-native': 'src/node.polyfill.ts',
    'src/lib/errors/sentry': 'src/node.polyfill.ts',
    'react-native-localize': 'src/node.polyfill.ts',
    'src/locales/i18n': 'src/node.polyfill.ts',
    'react-native-splash-screen': 'src/node.polyfill.ts',
    'src/lib/ipfs': 'src/node.polyfill.ts',
    'typeorm/browser': 'node_modules/typeorm',
  },
  moduleDirectories: ['node_modules', '<rootDir>'],
  testMatch: ['**/tests/**/*.test.[tj]s?(x)'],
  testPathIgnorePatterns: ['/node_modules/.*', '/legacy/.*'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
}
