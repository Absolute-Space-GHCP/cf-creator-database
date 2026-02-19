/**
 * @file CreatorBrowse.tsx
 * @description Browse creators with craft/platform/location filters – Beta Control Center design
 * @author Charley Scholz, JLIT
 * @coauthor Claude Opus 4.6, Claude Code (coding assistant), Cursor (IDE)
 * @updated 2026-02-19
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, type Creator } from '../api/client';
import '../components/ui/ui.css';
import './CreatorBrowse.css';

const CRAFT_OPTIONS = [
  'cinematographer', 'director', 'editor', 'colorist', 'vfx_artist',
  'compositor', 'motion_designer', '3d_artist', 'animator',
  'sound_designer', 'producer', 'gaffer', 'photographer', 'other',
];

const PLATFORM_OPTIONS = [
  'vimeo', 'behance', 'artstation', 'instagram', 'youtube',
  'tiktok', 'the_rookies', 'motionographer', 'dribbble', 'linkedin', 'other',
];

function getCraftIcon(craft?: string): string {
  const icons: Record<string, string> = {
    cinematographer: '🎬', director: '🎥', motion_designer: '✨',
    vfx_artist: '🎨', colorist: '🎨', animator: '🎞️',
    sound_designer: '🎧', '3d_artist': '📦', editor: '✂️',
    compositor: '🎨', producer: '📋', gaffer: '💡',
    photographer: '📷', other: '✨',
  };
  return icons[craft ?? ''] ?? '🎬';
}

export default function CreatorBrowse() {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [craft, setCraft] = useState('');
  const [platform, setPlatform] = useState('');
  const [location, setLocation] = useState('');

  useEffect(() => {
    fetchCreators();
  }, [craft, platform, location]);

  async function fetchCreators() {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = { limit: '100' };
      if (craft) params.craft = craft;
      if (platform) params.platform = platform;
      if (location) params.location = location;
      const res = await api.getCreators(params);
      setCreators(res.creators);
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : 'Failed to load creators');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="browse-page">
      <div className="browse-header">
        <h1>Creators</h1>
        <span className="browse-count font-mono text-muted">
          {loading ? '...' : `${creators.length} found`}
        </span>
      </div>

      <div className="browse-filters">
        <span className="filter-label">Craft</span>
        {CRAFT_OPTIONS.map((c) => (
          <button
            key={c}
            type="button"
            className={`filter-chip ${craft === c ? 'active' : ''}`}
            onClick={() => setCraft(craft === c ? '' : c)}
          >
            {c.replace(/_/g, ' ')}
          </button>
        ))}
        <span className="filter-label">Platform</span>
        {PLATFORM_OPTIONS.map((p) => (
          <button
            key={p}
            type="button"
            className={`filter-chip ${platform === p ? 'active' : ''}`}
            onClick={() => setPlatform(platform === p ? '' : p)}
          >
            {p.replace(/_/g, ' ')}
          </button>
        ))}
        <input
          className="filter-input"
          type="text"
          placeholder="Location (e.g. New York)"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
        {(craft || platform || location) && (
          <button
            type="button"
            className="filter-chip"
            onClick={() => { setCraft(''); setPlatform(''); setLocation(''); }}
          >
            Clear all
          </button>
        )}
      </div>

      {error && (
        <div className="error-banner">
          {error}
        </div>
      )}

      {loading ? (
        <div className="loading">
          <div className="spinner" />
          Loading...
        </div>
      ) : creators.length === 0 ? (
        <div className="empty-state">
          <h3>No creators found</h3>
          <p>Try adjusting your filters</p>
        </div>
      ) : (
        <div className="creator-grid stagger">
          {creators.map((c) => (
            <Link key={c.id} to={`/creators/${c.id}`} className="creator-card-link">
              <div className="result-item creator-card">
                <div className="result-avatar">
                  {getCraftIcon(c.craft?.primary)}
                </div>
                <div className="result-content">
                  <div className="result-name">
                    {c.name}
                    {c.matching?.isGoldenRecord && (
                      <span className="golden-tag">★ Golden</span>
                    )}
                  </div>
                  <div className="result-meta">
                    {[c.craft?.primary?.replace(/_/g, ' '), c.platform, c.contact?.location]
                      .filter(Boolean)
                      .join(' · ')}
                  </div>
                </div>
                {typeof c.matching?.qualityScore === 'number' && (
                  <div className="result-score">
                    <span className="score-value">{c.matching.qualityScore}</span>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
