import { Link } from 'react-router';
import logo from '../assets/rayfield-logo.png';

/**
 * Sticky black header: brand lockup on the left (UI_PLAN.md §1). Navigation links (right)
 * arrive with the auth tests.
 */
export function Header() {
  return (
    <header className="cyber-header">
      <Link to="/" className="brand">
        <img src={logo} alt="Rayfield" className="brand-logo" />
        {/* Below sm the logo already says RAYFIELD, so the name shortens to AUTOSHOW. */}
        <span className="brand-name">
          <span className="hidden sm:inline">Rayfield </span>Autoshow
        </span>
      </Link>
      <nav className="flex h-full" aria-label="Main" />
    </header>
  );
}
