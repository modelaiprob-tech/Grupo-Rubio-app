module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverageFrom: ['utils/**/*.js'],
  coverageDirectory: 'coverage',
  clearMocks: true,
  restoreMocks: true
};
