/**
 * @file ProtectedRoute.tsx
 * @description Route guard that checks authentication via /api/v1/auth/me
 * @author Charley Scholz, JLAI
 * @coauthor Claude Opus 4.6, Claude Code (coding assistant), Cursor (IDE)
 * @created 2026-03-05
 * @updated 2026-03-05
 */

import { useEffect, useState, type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { api } from '../../api/client';

const AUTH_CACHE_KEY = 'cf-auth-check';
const AUTH_CACHE_TTL = 5 * 60 * 1000;

interface CachedAuth {
  authenticated: boolean;
  email?: string;
  method?: string;
  timestamp: number;
}

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<CachedAuth | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cached = sessionStorage.getItem(AUTH_CACHE_KEY);
    if (cached) {
      const parsed: CachedAuth = JSON.parse(cached);
      if (Date.now() - parsed.timestamp < AUTH_CACHE_TTL) {
        setAuth(parsed);
        setLoading(false);
        return;
      }
    }

    api.getAuthMe()
      .then(res => {
        const entry: CachedAuth = {
          authenticated: res.authenticated,
          email: res.email,
          method: res.method,
          timestamp: Date.now(),
        };
        sessionStorage.setItem(AUTH_CACHE_KEY, JSON.stringify(entry));
        setAuth(entry);
      })
      .catch(() => {
        setAuth({ authenticated: false, timestamp: Date.now() });
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Checking authentication...</div>;
  }
  if (!auth?.authenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}
