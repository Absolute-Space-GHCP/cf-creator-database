import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, type Creator } from '../api/client';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Tag from '../components/ui/Tag';
import Skeleton from '../components/ui/Skeleton';
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

export default function CreatorBrowse() {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const [craft, setCraft] = useState('');
  const [platform, setPlatform] = useState('');
  const [location, setLocation] = useState('');

  useEffect(() => {
    fetchCreators();
  }, [craft, platform, location]);

  async function fetchCreators() {
    setLoading(true);
    try {
      const params: Record<string, string> = { limit: '100' };
      if (craft) params.craft = craft;
      if (platform) params.platform = platform;
      if (location) params.location = location;
      const res = await api.getCreators(params);
      setCreators(res.creators);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="browse-page">
      <div className="browse-sidebar">
        <h3 className="sidebar-title">Filters</h3>

        <label className="filter-label">Craft</label>
        <select className="filter-select" value={craft} onChange={(e) => setCraft(e.target.value)}>
          <option value="">All crafts</option>
          {CRAFT_OPTIONS.map((c) => (
            <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>
          ))}
        </select>

        <label className="filter-label">Platform</label>
        <select className="filter-select" value={platform} onChange={(e) => setPlatform(e.target.value)}>
          <option value="">All platforms</option>
          {PLATFORM_OPTIONS.map((p) => (
            <option key={p} value={p}>{p.replace(/_/g, ' ')}</option>
          ))}
        </select>

        <label className="filter-label">Location</label>
        <input
          className="filter-input"
          placeholder="e.g. New York"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />

        <button className="filter-clear" onClick={() => { setCraft(''); setPlatform(''); setLocation(''); }}>
          Clear all
        </button>
      </div>

      <div className="browse-main">
        <div className="browse-header">
          <h1>Creators</h1>
          <span className="browse-count">{loading ? '...' : `${creators.length} found`}</span>
        </div>

        {loading ? (
          <div className="creator-grid">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <Skeleton height="1.5rem" width="60%" />
                <Skeleton height="1rem" width="40%" className="mt-2" />
                <Skeleton height="0.75rem" width="80%" className="mt-2" />
              </Card>
            ))}
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
                <Card hoverable className="creator-card">
                  <div className="creator-card-header">
                    <h3 className="creator-card-name">{c.name}</h3>
                    {c.matching?.isGoldenRecord && <Badge variant="gold">Golden</Badge>}
                  </div>
                  {c.handle && <div className="creator-card-handle">{c.handle}</div>}
                  <div className="creator-card-meta">
                    {c.craft?.primary && (
                      <Badge variant="default">{c.craft.primary.replace(/_/g, ' ')}</Badge>
                    )}
                    <Badge variant="info">{c.platform}</Badge>
                    {c.contact?.location && (
                      <span className="creator-card-location">{c.contact.location}</span>
                    )}
                  </div>
                  {c.craft?.technicalTags && c.craft.technicalTags.length > 0 && (
                    <div className="creator-card-tags">
                      {c.craft.technicalTags.slice(0, 4).map((t) => (
                        <Tag key={t}>{t}</Tag>
                      ))}
                      {c.craft.technicalTags.length > 4 && (
                        <Tag>+{c.craft.technicalTags.length - 4}</Tag>
                      )}
                    </div>
                  )}
                  {typeof c.matching?.qualityScore === 'number' && (
                    <div className="creator-card-score">
                      <div className="score-bar">
                        <div
                          className="score-bar-fill"
                          style={{
                            width: `${c.matching.qualityScore}%`,
                            background: c.matching.qualityScore >= 80
                              ? 'var(--color-success)'
                              : c.matching.qualityScore >= 50
                                ? 'var(--color-gold)'
                                : 'var(--color-text-muted)',
                          }}
                        />
                      </div>
                      <span className="score-value">{c.matching.qualityScore}</span>
                    </div>
                  )}
                  {c.contact?.portfolio_url && (
                    <span className="creator-card-portfolio">Portfolio &rarr;</span>
                  )}
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
