import { loadTestEnv } from './loadTestEnv';

// Runs in every test file before any module is imported, because src/config/env.ts
// validates process.env at import time.
loadTestEnv();
