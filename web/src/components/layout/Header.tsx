import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import './Header.css';

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const navItems = [
    { to: '/', label: 'Home' },
    { to: '/creators', label: 'Creators' },
    { to: '/match', label: 'Match Brief' },
    { to: '/admin', label: 'Admin' },
    { to: '/status', label: 'Status' },
  ];

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      setQuery('');
    }
  }

  return (
    <header className="header">
      <div className="header-inner">
        <Link to="/" className="header-logo">
          <span className="logo-catch">Catch</span>
          <span className="logo-fire">Fire</span>
        </Link>

        <nav className="header-nav">
          {navItems.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={`nav-link ${location.pathname === to ? 'active' : ''}`}
            >
              {label}
            </Link>
          ))}
        </nav>

        <form className="header-search" onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Search creators..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="header-search-input"
          />
        </form>
      </div>
    </header>
  );
}
