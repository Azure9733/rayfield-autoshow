/**
 * Last line of defence before destructive test setup: throws unless the connected database
 * is a *_test database, so a misconfigured URL can't wipe dev or production data.
 */
export function assertTestDatabase(name: string): void {
  if (!name.endsWith('_test')) {
    throw new Error(`Refusing to modify non-test database "${name}"`);
  }
}
