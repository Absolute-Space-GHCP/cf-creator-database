import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <span className="footer-logo">
            <span className="logo-catch">Catch</span>
            <span className="logo-fire">Fire</span>
          </span>
          <span className="footer-tagline">Finding craft, not clout.</span>
        </div>
        <div className="footer-links">
          <a href="/" className="footer-link">Home</a>
          <a href="/dashboard" className="footer-link">Dashboard</a>
          <a href="/testing" className="footer-link">Testing</a>
          <a href="/health" className="footer-link">Health Check</a>
          <a href="/api/v1/stats" className="footer-link">API Stats</a>
        </div>
        <div className="footer-meta">
          <span>Johannes Leonardo</span>
          <span className="footer-dot">&middot;</span>
          <span>{new Date().getFullYear()}</span>
        </div>
      </div>
    </footer>
  );
}
