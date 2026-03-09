/**
 * @file Status.tsx
 * @description System Status page – comprehensive health check dashboard
 * @author Charley Scholz, JLAI
 * @coauthor Claude Opus 4.6, Claude Code (coding assistant), Cursor (IDE)
 * @created 2026-01-28
 * @updated 2026-03-05
 */

import { useEffect, useState, useCallback } from 'react';
import { api, type StatsResponse } from '../api/client';
import './Status.css';

type CheckStatus = 'online' | 'offline' | 'warning' | 'loading';
type Section = 'core' | 'ai' | 'pipeline' | 'auth';

interface ServiceCheck {
  name: string;
  section: Section;
  status: CheckStatus;
  message: string;
  responseTime?: number;
  details?: Record<string, string | number>;
}

const SECTION_META: Record<Section, { title: string; order: number }> = {
  core: { title: 'Core Services', order: 0 },
  ai: { title: 'AI Services', order: 1 },
  pipeline: { title: 'Data Pipeline', order: 2 },
  auth: { title: 'Authentication', order: 3 },
};

async function timed<T>(fn: () => Promise<T>): Promise<{ data: T; ms: number }> {
  const t0 = performance.now();
  const data = await fn();
  return { data, ms: Math.round(performance.now() - t0) };
}

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function Status() {
  const [checks, setChecks] = useState<ServiceCheck[]>([]);
  const [stats, setStats] = useState<StatsResponse['stats'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const runAllChecks = useCallback(async () => {
    setLoading(true);

    const placeholders: ServiceCheck[] = [
      { name: 'Cloud Run (Express)', section: 'core', status: 'loading', message: 'Checking...' },
      { name: 'Firestore Database', section: 'core', status: 'loading', message: 'Checking...' },
      { name: 'Gemini AI (LLM)', section: 'ai', status: 'loading', message: 'Checking...' },
      { name: 'Embeddings Service', section: 'ai', status: 'loading', message: 'Checking...' },
      { name: 'Scraper Pipeline', section: 'pipeline', status: 'loading', message: 'Checking...' },
      { name: 'User Authentication', section: 'auth', status: 'loading', message: 'Checking...' },
    ];
    setChecks(placeholders);

    const update = (name: string, patch: Partial<ServiceCheck>) =>
      setChecks((prev) => prev.map((c) => (c.name === name ? { ...c, ...patch } : c)));

    const checkHealth = async () => {
      try {
        const { data: health, ms } = await timed(() => api.getHealth());
        update('Cloud Run (Express)', {
          status: health.status === 'ok' ? 'online' : 'warning',
          message: `${health.app} v${health.version}`,
          responseTime: ms,
          details: {
            Project: health.config.projectId,
            Region: health.config.region,
            Model: health.config.model,
          },
        });
      } catch {
        update('Cloud Run (Express)', {
          status: 'offline',
          message: 'Health check failed',
        });
      }
    };

    const checkFirestore = async () => {
      try {
        const { data: statsRes, ms } = await timed(() => api.getStats());
        setStats(statsRes.stats);
        update('Firestore Database', {
          status: 'online',
          message: `${statsRes.stats.totalCreators} creators, ${statsRes.stats.goldenRecords} Golden Records`,
          responseTime: ms,
          details: {
            'Cache Age': statsRes.stats.cacheAge,
            Crafts: Object.keys(statsRes.stats.byCraft).length,
            Platforms: Object.keys(statsRes.stats.byPlatform).length,
          },
        });
      } catch {
        update('Firestore Database', {
          status: 'offline',
          message: 'Cannot reach Firestore',
        });
      }
    };

    const checkLLM = async () => {
      try {
        const { data: llm, ms } = await timed(() => api.testLLM());
        update('Gemini AI (LLM)', {
          status: llm.connected ? 'online' : 'offline',
          message: llm.message,
          responseTime: ms,
          details: { Model: llm.model },
        });
      } catch {
        update('Gemini AI (LLM)', {
          status: 'offline',
          message: 'LLM connection failed',
        });
      }
    };

    const checkEmbeddings = async () => {
      try {
        const { data: emb, ms } = await timed(() => api.testEmbeddings());
        update('Embeddings Service', {
          status: emb.success ? 'online' : 'offline',
          message: emb.success ? `${emb.model} (${emb.dimensions}d)` : emb.error || 'Failed',
          responseTime: ms,
          details: {
            Model: emb.model,
            Dimensions: emb.dimensions,
            Client: emb.clientType,
          },
        });
      } catch {
        update('Embeddings Service', {
          status: 'offline',
          message: 'Embedding test failed',
        });
      }
    };

    const checkScraper = async () => {
      try {
        const { data: scraper, ms } = await timed(() => api.getScraperStatus());
        const lastRun = scraper.lastRun;
        if (lastRun) {
          const statusLabel = lastRun.status === 'completed' ? 'online' : 'warning';
          update('Scraper Pipeline', {
            status: statusLabel,
            message: `Last run: ${formatRelativeTime(lastRun.timestamp)} (${lastRun.status})`,
            responseTime: ms,
            details: {
              Status: lastRun.status,
              Platforms: lastRun.platforms.join(', '),
              'Creators Found': lastRun.creatorsFound,
              'Creators Imported': lastRun.creatorsImported,
              'Total Runs': scraper.totalRuns,
              Duration: `${(lastRun.duration / 1000).toFixed(1)}s`,
            },
          });
        } else {
          update('Scraper Pipeline', {
            status: 'warning',
            message: 'No scraper runs recorded',
            responseTime: ms,
            details: { 'Total Runs': scraper.totalRuns },
          });
        }
      } catch {
        update('Scraper Pipeline', {
          status: 'offline',
          message: 'Scraper status unavailable',
        });
      }
    };

    const checkAuth = async () => {
      try {
        const { data: auth, ms } = await timed(() => api.getAuthMe());
        if (auth.authenticated) {
          update('User Authentication', {
            status: 'online',
            message: auth.email || 'Authenticated',
            responseTime: ms,
            details: {
              Method: auth.method || 'unknown',
              ...(auth.email ? { Email: auth.email } : {}),
            },
          });
        } else {
          update('User Authentication', {
            status: 'warning',
            message: 'Not authenticated',
            responseTime: ms,
          });
        }
      } catch {
        update('User Authentication', {
          status: 'warning',
          message: 'Auth check unavailable (may be expected)',
        });
      }
    };

    await Promise.allSettled([
      checkHealth(),
      checkFirestore(),
      checkLLM(),
      checkEmbeddings(),
      checkScraper(),
      checkAuth(),
    ]);

    setLastChecked(new Date());
    setLoading(false);
  }, []);

  useEffect(() => {
    runAllChecks();
  }, [runAllChecks]);

  const onlineCount = checks.filter((c) => c.status === 'online').length;
  const totalResolved = checks.filter((c) => c.status !== 'loading').length;
  const allOnline = totalResolved === checks.length && onlineCount === checks.length;

  const sections = Object.entries(SECTION_META)
    .sort(([, a], [, b]) => a.order - b.order)
    .map(([key, meta]) => ({
      key: key as Section,
      title: meta.title,
      checks: checks.filter((c) => c.section === key),
    }))
    .filter((s) => s.checks.length > 0);

  return (
    <div className="status-page">
      <div className="status-header">
        <div>
          <h1>System Status</h1>
          {lastChecked && (
            <p className="status-last-checked">
              Last checked: {lastChecked.toLocaleTimeString()}
            </p>
          )}
        </div>
        <button
          type="button"
          className="btn-secondary"
          onClick={runAllChecks}
          disabled={loading}
        >
          {loading ? 'Checking...' : 'Refresh All'}
        </button>
      </div>

      {/* Overall status */}
      {totalResolved > 0 && (
        <div className="overall-card">
          <span
            className={`status-dot ${allOnline ? 'online' : loading ? 'loading' : 'warning'}`}
            aria-hidden
          />
          <span className="overall-text">
            {allOnline
              ? 'All systems operational'
              : `${onlineCount}/${checks.length} services online`}
          </span>
        </div>
      )}

      {/* Grouped service sections */}
      {sections.map((section) => (
        <div key={section.key} className="status-section">
          <h2 className="section-title">{section.title}</h2>
          <div className="services-list">
            {section.checks.map((svc) => (
              <div key={svc.name} className="service-card">
                <div className="service-header">
                  <div className="service-info">
                    <div>
                      <span className="service-name">{svc.name}</span>
                      <span className="service-meta">{svc.message}</span>
                    </div>
                  </div>
                  <div className="service-right">
                    {svc.responseTime != null && (
                      <span className="response-time">{svc.responseTime}ms</span>
                    )}
                    <span className={`service-status ${svc.status}`}>
                      <span className={`status-dot ${svc.status}`} aria-hidden />
                      {svc.status === 'loading' ? 'checking' : svc.status}
                    </span>
                  </div>
                </div>
                {svc.details && (
                  <div className="service-details">
                    {Object.entries(svc.details).map(([key, val]) => (
                      <div key={key} className="service-detail-row">
                        <span className="detail-key">{key}</span>
                        <span className="detail-val">{String(val)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Database stats */}
      {stats && (
        <div className="status-stats">
          <div className="stat-card">
            <div className="stat-number">{stats.totalCreators}</div>
            <div className="stat-label">Total Creators</div>
          </div>
          <div className="stat-card">
            <div className="stat-number stat-gold">{stats.goldenRecords}</div>
            <div className="stat-label">Golden Records</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{Object.keys(stats.byCraft).length}</div>
            <div className="stat-label">Craft Types</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{Object.keys(stats.byPlatform).length}</div>
            <div className="stat-label">Platforms</div>
          </div>
        </div>
      )}

      {loading && checks.every((c) => c.status === 'loading') && (
        <div className="status-loading">
          <div className="spinner" />
          <span>Checking services...</span>
        </div>
      )}
    </div>
  );
}
