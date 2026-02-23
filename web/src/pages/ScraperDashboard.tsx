/**
 * @file ScraperDashboard.tsx
 * @description Scraper monitoring admin dashboard – status, reports, and manual trigger
 * @author Charley Scholz, JLAI
 * @coauthor Claude Opus 4.6, Cursor (IDE)
 * @created 2026-02-23
 * @updated 2026-02-23
 */

import { useEffect, useState, useCallback } from 'react';
import { api, type ScraperStatusResponse, type ScraperReport } from '../api/client';
import { useToast } from '../components/ui/Toast';
import './ScraperDashboard.css';

const AVAILABLE_PLATFORMS = ['vimeo', 'behance', 'artstation'];

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return `${minutes}m ${remaining}s`;
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function ScraperDashboard() {
  const { showToast } = useToast();

  const [status, setStatus] = useState<ScraperStatusResponse | null>(null);
  const [reports, setReports] = useState<ScraperReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [statusRes, reportsRes] = await Promise.all([
        api.getScraperStatus(),
        api.getScraperReports(),
      ]);
      setStatus(statusRes);
      setReports(reportsRes.reports);
    } catch {
      showToast('Failed to load scraper data', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function togglePlatform(platform: string) {
    setSelectedPlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform]
    );
  }

  async function handleTrigger() {
    setTriggering(true);
    try {
      const platforms = selectedPlatforms.length > 0 ? selectedPlatforms : undefined;
      const res = await api.triggerScrape(platforms);
      showToast(
        `Scrape triggered for ${res.platforms.join(', ')} (limit: ${res.limit})`,
        'success',
      );
      await fetchData();
    } catch {
      showToast('Failed to trigger scrape', 'error');
    } finally {
      setTriggering(false);
    }
  }

  return (
    <div className="scraper-page">
      <h1>Scraper Dashboard</h1>
      <p className="scraper-description">
        Monitor automated creator scraping and trigger manual runs.
      </p>

      {loading ? (
        <div className="scraper-loading">
          <div className="spinner" />
          <span>Loading scraper data...</span>
        </div>
      ) : (
        <>
          {/* Status card */}
          <div className="scraper-card">
            <div className="scraper-card-header">
              <div className="card-icon">⚡</div>
              <h3 className="card-title">Scraper Status</h3>
            </div>
            <div className="scraper-status-grid">
              <div className="status-item">
                <span className="status-label">State</span>
                <span className={`status-value ${status?.running ? 'running' : 'idle'}`}>
                  <span className="status-dot" />
                  {status?.running ? 'Running' : 'Idle'}
                </span>
              </div>
              <div className="status-item">
                <span className="status-label">Last Run</span>
                <span className="status-value">
                  {status?.lastRun ? formatTimestamp(status.lastRun) : '—'}
                </span>
              </div>
              <div className="status-item">
                <span className="status-label">Total Runs</span>
                <span className="status-value mono">{status?.totalRuns ?? 0}</span>
              </div>
              <div className="status-item">
                <span className="status-label">Platforms</span>
                <div className="platform-tags">
                  {status?.platforms.map((p) => (
                    <span key={p} className="platform-tag">{p}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Trigger card */}
          <div className="scraper-card">
            <div className="scraper-card-header">
              <div className="card-icon">▶</div>
              <h3 className="card-title">Manual Trigger</h3>
            </div>
            <p className="trigger-hint">
              Select platforms to scrape, or leave empty to scrape all.
            </p>
            <div className="trigger-controls">
              <div className="platform-selector">
                {AVAILABLE_PLATFORMS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    className={`platform-chip ${selectedPlatforms.includes(p) ? 'selected' : ''}`}
                    onClick={() => togglePlatform(p)}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <button
                type="button"
                className="btn-primary"
                onClick={handleTrigger}
                disabled={triggering}
              >
                {triggering ? 'Triggering...' : 'Trigger Scrape'}
              </button>
            </div>
          </div>

          {/* Reports table */}
          <div className="scraper-card">
            <div className="scraper-card-header">
              <div className="card-icon">📋</div>
              <h3 className="card-title">Recent Reports</h3>
            </div>
            {reports.length === 0 ? (
              <p className="no-reports">No scrape reports yet.</p>
            ) : (
              <div className="scraper-table-wrapper">
                <table className="scraper-table">
                  <thead>
                    <tr>
                      <th>Timestamp</th>
                      <th>Platform</th>
                      <th>Found</th>
                      <th>Added</th>
                      <th>Duration</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map((r) => (
                      <tr key={r.id}>
                        <td>{formatTimestamp(r.timestamp)}</td>
                        <td>
                          <span className="platform-tag">{r.platform}</span>
                        </td>
                        <td className="mono">{r.creatorsFound}</td>
                        <td className="mono text-gold">{r.creatorsAdded}</td>
                        <td className="mono">{formatDuration(r.duration)}</td>
                        <td>
                          <span className={`report-status ${r.status}`}>
                            {r.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
