module.exports = {
  testEnvironment: 'jest-environment-jsdom',
  testMatch: ['<rootDir>/test/**/*.test.js'],
  setupFiles: ['<rootDir>/test/setup.js'],
  // The library ships ESM (lit, zod, maska, …) — transform everything,
  // including node_modules, down to CJS for jest.
  transform: { '^.+\\.[jt]sx?$': 'babel-jest' },
  transformIgnorePatterns: [],
};
