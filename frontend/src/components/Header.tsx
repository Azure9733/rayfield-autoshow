import { useId, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router';
import logo from '../assets/rayfield-logo.png';
import { useAuth } from '../context/AuthContext';

/**
 * Black top bar: brand lockup on the left, nav for logged-in users on the right. Below lg the
 * nav collapses behind a Menu button into a dropdown panel.
 */
export function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuId = useId();

  function handleLogout() {
    setMenuOpen(false);
    logout();
    navigate('/login');
  }

  return (
    <header className="cyber-header">
      <Link to="/" className="brand">
        <img src={logo} alt="Rayfield" className="brand-logo" />
        <span className="brand-name">
          <span className="hidden sm:inline">Rayfield </span>Autoshow
        </span>
      </Link>
      {user && (
        <>
          <nav className="hidden h-full items-center lg:flex" aria-label="Main">
            <span className="hidden px-4 font-mono text-sm text-cp-muted xl:inline">
              {user.name}
            </span>
            <NavLink to="/" end className="cyber-nav-link">
              Inventory
            </NavLink>
            <button type="button" className="cyber-nav-link cursor-pointer" onClick={handleLogout}>
              Logout
            </button>
          </nav>
          <button
            type="button"
            className="flex size-11 cursor-pointer items-center justify-center text-white lg:hidden"
            aria-label="Menu"
            aria-expanded={menuOpen}
            aria-controls={menuId}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <svg viewBox="0 0 24 24" className="size-7" aria-hidden="true">
              <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2" />
            </svg>
          </button>
          {menuOpen && (
            <nav
              id={menuId}
              aria-label="Mobile"
              className="cyber-panel absolute top-full right-0 w-full sm:w-72 lg:hidden"
            >
              <p className="px-5 py-3 font-mono text-sm text-cp-muted">{user.name}</p>
              <NavLink to="/" end className="cyber-list-item" onClick={() => setMenuOpen(false)}>
                Inventory
              </NavLink>
              <button
                type="button"
                className="cyber-list-item cursor-pointer"
                onClick={handleLogout}
              >
                Logout
              </button>
            </nav>
          )}
        </>
      )}
    </header>
  );
}
