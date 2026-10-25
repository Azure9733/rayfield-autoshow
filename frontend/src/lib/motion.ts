/**
 * True when the user asked the OS for less motion. Animations that JS waits on (wipes, the
 * boot splash, the login sweep) check this and skip straight to their end state.
 */
export function prefersReducedMotion() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}
