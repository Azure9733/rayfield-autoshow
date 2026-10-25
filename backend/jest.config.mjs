/** @type {import('jest').Config} */
export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  globalSetup: '<rootDir>/tests/helpers/globalSetup.ts',
  setupFiles: ['<rootDir>/tests/helpers/setupEnv.ts'],
  setupFilesAfterEnv: ['<rootDir>/tests/helpers/setupDb.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    // Entry points and generated code: server.ts only calls listen(), migrations are SQL
    // files, and migrate.ts runs in globalSetup (outside coverage collection) on every run.
    '!src/server.ts',
    '!src/db/migrate.ts',
    '!src/db/migrations/**',
  ],
  coverageThreshold: {
    global: { lines: 90 },
  },
};
