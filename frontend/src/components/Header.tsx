import { useEffect, useId, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import logo from '../assets/rayfield-logo.png';
import { useAuth } from '../context/AuthContext';
import { UserIdentity } from './UserIdentity';

/**
 * Black top bar: brand lockup on the left, nav for logged-in users on the right. Below lg the
 * nav collapses behind a Menu button into a dropdown panel.
 */
export function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuId = useId();
  const headerRef = useRef<HTMLElement>(null);

  // While the menu is open, a tap anywhere outside the header closes it.
  useEffect(() => {
    if (!menuOpen) return;
    function onPointerDown(event: PointerEvent) {
      if (!headerRef.current?.contains(event.target as Node)) setMenuOpen(false);
    }
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [menuOpen]);

  function handleLogout() {
    setMenuOpen(false);
    logout();
    navigate('/login');
  }

  return (
    <header ref={headerRef} className="cyber-header">
      <Link to="/" className="brand">
        <img src={logo} alt="Rayfield" className="brand-logo" />
        <span className="brand-name">
          <span className="hidden sm:inline">Rayfield </span>Autoshow
        </span>
      </Link>
      {user && (
        <>
          <nav className="hidden h-full items-center gap-2 lg:flex" aria-label="Main">
            <span className="px-4">
              <UserIdentity user={user} />
            </span>
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
              <p className="px-5 py-3">
                <UserIdentity user={user} />
              </p>
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
