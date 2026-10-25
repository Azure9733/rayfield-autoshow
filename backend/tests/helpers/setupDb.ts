import { pool } from '../../src/db/client';
import { truncateAllTables } from './db';

// Every test starts from empty tables, so tests never depend on each other's data.
beforeEach(truncateAllTables);

// Each test file gets its own module registry, hence its own pool; close it or Jest hangs.
afterAll(() => pool.end());
