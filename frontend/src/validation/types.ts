/** A message per invalid field, keyed like the form's values. */
export type FieldErrors<T> = Partial<Record<keyof T, string>>;
