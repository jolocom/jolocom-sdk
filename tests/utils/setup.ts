// jest.mock('rn-fetch-blob', () => ({
//   __esModule: true,
//   default: {
//     DocumentDir: () => {},
//     polyfill: () => {},
//     fetch: jest.fn(),
//   },
// }))

jest.mock('src/lib/storage/storage', () => ({
  __esModule: true,
  Storage: jest.fn(),
}))
