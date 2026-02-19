import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="page" style={{ textAlign: 'center', paddingTop: 'var(--space-32)' }}>
      <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-5xl)', marginBottom: 'var(--space-4)' }}>
        404
      </h1>
      <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-8)' }}>
        This page doesn't exist.
      </p>
      <Link to="/" className="btn btn-primary btn-md">
        Back to Home
      </Link>
    </div>
  );
}
