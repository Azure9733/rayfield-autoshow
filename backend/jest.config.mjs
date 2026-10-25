/** @type {import('jest').Config} */
export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  globalSetup: '<rootDir>/tests/helpers/globalSetup.ts',
  setupFiles: ['<rootDir>/tests/helpers/setupEnv.ts'],
  setupFilesAfterEnv: ['<rootDir>/tests/helpers/setupDb.ts'],
};
