import eslint from '@eslint/js';
import { defineConfig } from 'eslint/config';
import prettier from 'eslint-config-prettier';
import tseslint from 'typescript-eslint';

export default defineConfig(
  { ignores: ['dist', 'coverage'] },
  eslint.configs.recommended,
  tseslint.configs.recommended,
  {
    rules: {
      // A leading _ marks a parameter that must exist but isn't used (e.g. Express's 4-arg
      // error handler signature).
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  // Last, so Prettier owns formatting and ESLint only reports real problems.
  prettier,
);
