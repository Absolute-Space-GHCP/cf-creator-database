import { useEffect, useState } from 'react';
import { api, type StatsResponse } from '../api/client';
import Card from '../components/ui/Card';
import StatusDot from '../components/ui/StatusDot';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import './Status.css';

interface ServiceStatus {
  name: string;
  status: 'online' | 'offline' | 'warning';
  message: string;
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
        details: {
          Project: health.config.projectId,
          Region: health.config.region,
          Model: health.config.model,
        },
      });
    } catch {
      results.push({ name: 'Cloud Run (Express)', status: 'offline', message: 'Health check failed' });
    }

    // Firestore
    try {
      const statsRes = await api.getStats();
      setStats(statsRes.stats);
      results.push({
        name: 'Firestore Database',
        status: 'online',
        message: `${statsRes.stats.totalCreators} creators, ${statsRes.stats.goldenRecords} Golden Records`,
        details: {
          'Cache Age': statsRes.stats.cacheAge,
          Crafts: Object.keys(statsRes.stats.byCraft).length,
          Platforms: Object.keys(statsRes.stats.byPlatform).length,
        },
      });
    } catch {
      results.push({ name: 'Firestore Database', status: 'offline', message: 'Cannot reach Firestore' });
    }

    // Gemini LLM
    try {
      const llm = await api.testLLM();
      results.push({
        name: 'Gemini AI (LLM)',
        status: llm.connected ? 'online' : 'offline',
        message: llm.message,
        details: { Model: llm.model },
      });
    } catch {
      results.push({ name: 'Gemini AI (LLM)', status: 'offline', message: 'LLM connection failed' });
    }

    // Embeddings
    try {
      const emb = await api.testEmbeddings();
      results.push({
        name: 'Embeddings Service',
        status: emb.success ? 'online' : 'offline',
        message: emb.success ? `${emb.model} (${emb.dimensions}d)` : emb.error || 'Failed',
        details: {
          Model: emb.model,
          Dimensions: emb.dimensions,
          Client: emb.clientType,
        },
      });
    } catch {
      results.push({ name: 'Embeddings Service', status: 'offline', message: 'Embedding test failed' });
    }

    setServices(results);
    setLastChecked(new Date());
    setLoading(false);
  }

  useEffect(() => { checkServices(); }, []);

  const onlineCount = services.filter((s) => s.status === 'online').length;
  const allOnline = services.length > 0 && onlineCount === services.length;

  return (
    <div className="status-page page">
      <div className="status-header">
        <div>
          <h1>System Status</h1>
          {lastChecked && (
            <p className="text-muted">Last checked: {lastChecked.toLocaleTimeString()}</p>
          )}
        </div>
        <Button variant="secondary" onClick={checkServices} disabled={loading}>
          {loading ? 'Checking...' : 'Refresh'}
        </Button>
      </div>

      {/* Overall status */}
      {!loading && (
        <Card variant={allOnline ? 'dark' : 'light'} className="overall-status-card">
          <StatusDot status={allOnline ? 'online' : 'warning'} />
          <span className="overall-status-text">
            {allOnline ? 'All systems operational' : `${onlineCount}/${services.length} services online`}
          </span>
        </Card>
      )}

      {/* Service cards */}
      <div className="service-grid stagger">
        {services.map((svc) => (
          <Card key={svc.name} className="service-card">
            <div className="service-header">
              <StatusDot status={svc.status} />
              <h3>{svc.name}</h3>
              <Badge variant={svc.status === 'online' ? 'success' : svc.status === 'warning' ? 'warning' : 'error'}>
                {svc.status}
              </Badge>
            </div>
            <p className="service-message">{svc.message}</p>
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
          </Card>
        ))}
      </div>

      {/* Database stats */}
      {stats && (
        <div className="status-stats-section">
          <h2>Database Statistics</h2>
          <div className="stats-grid">
            <Card className="stat-card">
              <div className="stat-number">{stats.totalCreators}</div>
              <div className="stat-label">Total Creators</div>
            </Card>
            <Card className="stat-card">
              <div className="stat-number stat-gold">{stats.goldenRecords}</div>
              <div className="stat-label">Golden Records</div>
            </Card>
            <Card className="stat-card">
              <div className="stat-number">{Object.keys(stats.byCraft).length}</div>
              <div className="stat-label">Craft Types</div>
            </Card>
            <Card className="stat-card">
              <div className="stat-number">{Object.keys(stats.byPlatform).length}</div>
              <div className="stat-label">Platforms</div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
