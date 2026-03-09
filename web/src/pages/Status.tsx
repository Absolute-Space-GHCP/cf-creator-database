/**
 * @file Status.tsx
 * @description System Status page – platform services and database statistics
 * @author Charley Scholz, JLAI
 * @coauthor Claude Opus 4.6, Claude Code (coding assistant), Cursor (IDE)
 * @created 2026-01-28
 * @updated 2026-02-19
 */

import { useEffect, useState } from 'react';
import { api, type StatsResponse } from '../api/client';
import './Status.css';

interface ServiceStatus {
  name: string;
  status: 'online' | 'offline' | 'warning';
  message: string;
  icon: string;
  details?: Record<string, string | number>;
}

export default function Status() {
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [stats, setStats] = useState<StatsResponse['stats'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  async function checkServices() {
    setLoading(true);
    const results: ServiceStatus[] = [];

    // Cloud Run / Express
    try {
      const health = await api.getHealth();
      results.push({
        name: 'Cloud Run (Express)',
        status: health.status === 'ok' ? 'online' : 'warning',
        message: `${health.app} v${health.version}`,
        icon: '☁️',
        details: {
          Project: health.config.projectId,
          Region: health.config.region,
          Model: health.config.model,
        },
      });
    } catch {
      results.push({
        name: 'Cloud Run (Express)',
        status: 'offline',
        message: 'Health check failed',
        icon: '☁️',
      });
    }

    // Firestore
    try {
      const statsRes = await api.getStats();
      setStats(statsRes.stats);
      results.push({
        name: 'Firestore Database',
        status: 'online',
        message: `${statsRes.stats.totalCreators} creators, ${statsRes.stats.goldenRecords} Golden Records`,
        icon: '🗄',
        details: {
          'Cache Age': statsRes.stats.cacheAge,
          Crafts: Object.keys(statsRes.stats.byCraft).length,
          Platforms: Object.keys(statsRes.stats.byPlatform).length,
        },
      });
    } catch {
      results.push({
        name: 'Firestore Database',
        status: 'offline',
        message: 'Cannot reach Firestore',
        icon: '🗄',
      });
    }

    // Gemini LLM
    try {
      const llm = await api.testLLM();
      results.push({
        name: 'Gemini AI (LLM)',
        status: llm.connected ? 'online' : 'offline',
        message: llm.message,
        icon: '🤖',
        details: { Model: llm.model },
      });
    } catch {
      results.push({
        name: 'Gemini AI (LLM)',
        status: 'offline',
        message: 'LLM connection failed',
        icon: '🤖',
      });
    }

    // Embeddings
    try {
      const emb = await api.testEmbeddings();
      results.push({
        name: 'Embeddings Service',
        status: emb.success ? 'online' : 'offline',
        message: emb.success ? `${emb.model} (${emb.dimensions}d)` : emb.error || 'Failed',
        icon: '📊',
        details: {
          Model: emb.model,
          Dimensions: emb.dimensions,
          Client: emb.clientType,
        },
      });
    } catch {
      results.push({
        name: 'Embeddings Service',
        status: 'offline',
        message: 'Embedding test failed',
        icon: '📊',
      });
    }

    setServices(results);
    setLastChecked(new Date());
    setLoading(false);
  }

  useEffect(() => {
    checkServices();
  }, []);

  const onlineCount = services.filter((s) => s.status === 'online').length;
  const allOnline = services.length > 0 && onlineCount === services.length;

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
          onClick={checkServices}
          disabled={loading}
        >
          {loading ? 'Checking...' : 'Refresh'}
        </button>
      </div>

      {/* Overall status */}
      {!loading && (
        <div className="overall-card">
          <span
            className={`status-dot ${allOnline ? 'online' : 'warning'}`}
            aria-hidden
          />
          <span className="overall-text">
            {allOnline
              ? 'All systems operational'
              : `${onlineCount}/${services.length} services online`}
          </span>
        </div>
      )}

      {/* Service cards */}
      <div className="services-list">
        {services.map((svc) => (
          <div key={svc.name} className="service-card">
            <div className="service-header">
              <div className="service-info">
                <span className="service-icon">{svc.icon}</span>
                <div>
                  <span className="service-name">{svc.name}</span>
                  <span className="service-meta">{svc.message}</span>
                </div>
              </div>
              <span className={`service-status ${svc.status}`}>
                <span className={`status-dot ${svc.status}`} aria-hidden />
                {svc.status}
              </span>
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

      {loading && services.length === 0 && (
        <div className="status-loading">
          <div className="spinner" />
          <span>Checking services...</span>
        </div>
      )}
    </div>
  );
}
