import { useEffect, useId, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import logo from '../assets/rayfield-logo.png';
import { useAuth } from '../context/AuthContext';
import { prefersReducedMotion } from '../lib/motion';
import { UserIdentity } from './UserIdentity';

// Matches the .mobile-menu.is-closing animation in index.css.
const MENU_CLOSE_MS = 160;

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
  // While the close animation plays the menu stays mounted, but inert and aria-hidden.
  const [menuClosing, setMenuClosing] = useState(false);
  const closeTimer = useRef<number | undefined>(undefined);

  useEffect(() => () => clearTimeout(closeTimer.current), []);

  function finishClose() {
    clearTimeout(closeTimer.current);
    setMenuClosing(false);
  }

  function closeMenu() {
    setMenuOpen(false);
    if (prefersReducedMotion()) return;
    setMenuClosing(true);
    // animationend alone isn't enough (a background tab, CSS that didn't load).
    closeTimer.current = window.setTimeout(finishClose, MENU_CLOSE_MS + 40);
  }

  function toggleMenu() {
    if (menuOpen) {
      closeMenu();
    } else {
      finishClose();
      setMenuOpen(true);
    }
  }

  // While the menu is open, a tap anywhere outside the header closes it.
  useEffect(() => {
    if (!menuOpen) return;
    function onPointerDown(event: PointerEvent) {
      if (!headerRef.current?.contains(event.target as Node)) closeMenu();
    }
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  });

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
            <button type="button" className="cyber-nav-link cursor-pointer">
              My Garage
            </button>
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
            onClick={toggleMenu}
          >
            {/* Three bars that morph into a cross while the menu is open */}
            <svg
              viewBox="0 0 24 24"
              className={`menu-icon size-7 ${menuOpen ? 'is-open' : ''}`}
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <line className="menu-icon-top" x1="3" y1="6" x2="21" y2="6" />
              <line className="menu-icon-middle" x1="3" y1="12" x2="21" y2="12" />
              <line className="menu-icon-bottom" x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          {(menuOpen || menuClosing) && (
            <nav
              id={menuId}
              aria-label="Mobile"
              aria-hidden={menuClosing || undefined}
              inert={menuClosing}
              onAnimationEnd={menuClosing ? finishClose : undefined}
              className={`mobile-menu ${menuClosing ? 'is-closing' : 'is-opening'} cyber-panel absolute top-full right-0 w-full sm:w-72 lg:hidden`}
            >
              <p className="px-5 py-3">
                <UserIdentity user={user} />
              </p>
              <button type="button" className="cyber-list-item cursor-pointer">
                My Garage
              </button>
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
