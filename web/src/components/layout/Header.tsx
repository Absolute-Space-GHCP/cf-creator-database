import { Link, useLocation } from 'react-router-dom';
import './Header.css';

export default function Header() {
  const location = useLocation();

  const reactLinks = [
    { to: '/how-it-works', label: 'How It Works' },
    { to: '/creators', label: 'Browse Creators' },
    { to: '/admin', label: 'Admin' },
    { to: '/status', label: 'Status' },
  ];

  return (
    <header className="header">
      <div className="header-inner">
        <a href="/" className="header-logo">
          <span className="logo-catch">Catch</span>
          <span className="logo-fire">Fire</span>
        </a>

        <nav className="header-nav">
          <a href="/" className="nav-link">Home</a>
          <a href="/dashboard" className="nav-link">Dashboard</a>
          <a href="/testing" className="nav-link">Match Test</a>
          <span className="nav-divider" />
          {reactLinks.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={`nav-link ${location.pathname === to ? 'active' : ''}`}
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
