import { Link, NavLink, useNavigate } from 'react-router';
import logo from '../assets/rayfield-logo.png';
import { useAuth } from '../context/AuthContext';

/** Black top bar: brand lockup on the left, nav for logged-in users on the right. */
export function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
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
        <nav className="flex items-center h-full" aria-label="Main">
          <span className="hidden xl:inline px-4 font-mono text-sm text-cp-muted">{user.name}</span>
          <NavLink to="/" end className="cyber-nav-link">
            Inventory
          </NavLink>
          <button type="button" className="cyber-nav-link cursor-pointer" onClick={handleLogout}>
            Logout
          </button>
        </nav>
      )}
    </header>
  );
}
