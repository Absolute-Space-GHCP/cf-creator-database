/**
 * @file Login.tsx
 * @description Token-based login page with /auth/me validation and IAP detection
 * @author Charley Scholz, JLAI
 * @coauthor Claude Opus 4.6, Claude Code (coding assistant), Cursor (IDE)
 * @created 2026-02-23
 * @updated 2026-03-05
 */

import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import './Login.css';

const TOKEN_KEY = 'cf-auth-token';
const AUTH_CACHE_KEY = 'cf-auth-check';

export default function Login() {
  const navigate = useNavigate();
  const [token, setToken] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [iapMessage, setIapMessage] = useState<string | null>(null);

  const existing = localStorage.getItem(TOKEN_KEY);

  useEffect(() => {
    let cancelled = false;
    api.getAuthMe()
      .then(res => {
        if (cancelled) return;
        if (res.authenticated && res.method === 'iap') {
          setIapMessage(`Signed in via Google SSO${res.email ? ` (${res.email})` : ''}`);
          const timer = setTimeout(() => navigate('/creators'), 1500);
          return () => clearTimeout(timer);
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [navigate]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token.trim()) return;

    setError(null);
    setLoading(true);

    try {
      localStorage.setItem(TOKEN_KEY, token.trim());
      const res = await api.getAuthMe();

      if (res.authenticated) {
        sessionStorage.setItem(AUTH_CACHE_KEY, JSON.stringify({
          authenticated: true,
          email: res.email,
          method: res.method,
          timestamp: Date.now(),
        }));
        navigate('/creators');
      } else {
        localStorage.removeItem(TOKEN_KEY);
        sessionStorage.removeItem(AUTH_CACHE_KEY);
        setError('Invalid token. Check your token and try again.');
      }
    } catch {
      localStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(AUTH_CACHE_KEY);
      setError('Token validation failed. Check your token and try again.');
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(AUTH_CACHE_KEY);
    setToken('');
    setError(null);
    setIapMessage(null);
  }

  if (iapMessage) {
    return (
      <div className="login-page">
        <div className="login-card">
          <h1>Authenticate</h1>
          <p className="login-status authenticated">{iapMessage}</p>
          <p className="login-subtitle">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>Authenticate</h1>
        <p className="login-subtitle">
          Enter your API token to access the CatchFire Matching Engine.
        </p>

        {existing ? (
          <>
            <p className="login-status authenticated">
              Token is stored. You are authenticated.
            </p>
            <button className="login-logout" onClick={handleLogout} type="button">
              Clear Token
            </button>
          </>
        ) : (
          <form className="login-form" onSubmit={handleSubmit}>
            {error && <div className="login-error">{error}</div>}
            <div className="login-field">
              <label htmlFor="token">API Token</label>
              <input
                id="token"
                type="password"
                value={token}
                onChange={e => setToken(e.target.value)}
                placeholder="Paste your token here"
                autoComplete="off"
                autoFocus
              />
            </div>
            <button className="login-submit" type="submit" disabled={loading || !token.trim()}>
              {loading ? 'Verifying...' : 'Sign In'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
