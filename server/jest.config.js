export default {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  moduleFileExtensions: ['js', 'json'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  setupFiles: ['<rootDir>/tests/setup.js'],
  transform: {
    '^.+\\.js$': 'babel-jest'
  },
  transformIgnorePatterns: [
    '/node_modules/(?!(dotenv)/)'
  ],
  verbose: true,
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/tests/'
  ]
}; 