// Client-side copies of the backend's register rules and messages (backend/src/modules/auth/
// auth.schemas.ts), so most mistakes show instantly; the backend still validates everything.

export interface RegisterValues {
  name: string;
  email: string;
  password: string;
  confirm: string;
}

export type FieldErrors<T> = Partial<Record<keyof T, string>>;

// Deliberately loose: something@something.tld. The backend has the final say on format.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Returns a message per invalid field; an empty object means the form can be sent. */
export function validateRegister(values: RegisterValues): FieldErrors<RegisterValues> {
  const errors: FieldErrors<RegisterValues> = {};
  const name = values.name.trim();
  if (name.length < 1 || name.length > 60) errors.name = 'Name must be 1–60 characters';
  if (!EMAIL_PATTERN.test(values.email.trim())) errors.email = 'Enter a valid email address';
  if (values.password.length < 8) {
    errors.password = 'Password must be at least 8 characters';
  } else if (new TextEncoder().encode(values.password).length > 72) {
    // bcrypt ignores everything after byte 72, so the limit is bytes, as on the backend.
    errors.password = 'Password is too long (max 72 characters)';
  }
  return errors;
}
