import { useState, type FormEvent } from 'react';
import './ui.css';

interface SearchBarProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  size?: 'md' | 'lg';
  defaultValue?: string;
  loading?: boolean;
}

export default function SearchBar({
  placeholder = 'Search...',
  onSearch,
  size = 'md',
  defaultValue = '',
  loading = false,
}: SearchBarProps) {
  const [value, setValue] = useState(defaultValue);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (value.trim()) onSearch(value.trim());
  }

  return (
    <form className={`search-bar search-bar-${size}`} onSubmit={handleSubmit}>
      <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
      </svg>
      <input
        type="text"
        className="search-input"
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={loading}
      />
      <button type="submit" className="search-submit" disabled={!value.trim() || loading}>
        {loading ? 'Searching...' : 'Search'}
      </button>
    </form>
  );
}
