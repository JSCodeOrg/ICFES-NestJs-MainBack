module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverage: true,
  coverageDirectory: '../coverage',
  coverageReporters: ['html', 'text'],

  collectCoverageFrom: ['**/*.service.ts', '**/*.controller.ts'],

  coverageThreshold: {
    global: {
      branches: 70,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },

  testEnvironment: 'node',
};
