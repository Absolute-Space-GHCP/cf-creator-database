import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, type StatsResponse } from '../api/client';
import Card from '../components/ui/Card';
import SearchBar from '../components/ui/SearchBar';
import Skeleton from '../components/ui/Skeleton';
import './Home.css';

export default function Home() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<StatsResponse['stats'] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getStats().then((r) => setStats(r.stats)).catch(console.error).finally(() => setLoading(false));
  }, []);

  function handleSearch(query: string) {
    navigate(`/search?q=${encodeURIComponent(query)}`);
  }

  const topCrafts = stats
    ? Object.entries(stats.byCraft)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 6)
    : [];

  return (
    <div className="home-page">
      {/* Hero */}
      <section className="hero-section">
        <div className="hero-inner">
          <h1 className="hero-title">
            Discover the world&#8217;s best
            <br />
            <span className="text-gold">storytellers</span>
          </h1>
          <p className="hero-subtitle">
            AI-powered creator matching focused on craft and creativity, not clout.
          </p>
          <div className="hero-search">
            <SearchBar
              size="lg"
              placeholder="Find a cinematographer for a luxury campaign..."
              onSearch={handleSearch}
            />
          </div>
          <div className="hero-suggestions">
            <span className="suggestion-label">Try:</span>
            {['documentary cinematographer', 'motion designer NYC', 'VFX artist editorial'].map((s) => (
              <button key={s} className="suggestion-chip" onClick={() => handleSearch(s)}>
                {s}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="section">
        <div className="section-inner">
          <div className="stats-grid stagger">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}>
                  <Skeleton height="2rem" width="60%" />
                  <Skeleton height="1rem" width="40%" className="mt-2" />
                </Card>
              ))
            ) : stats ? (
              <>
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
                  <div className="stat-label">Craft Categories</div>
                </Card>
                <Card className="stat-card">
                  <div className="stat-number">{Object.keys(stats.byPlatform).length}</div>
                  <div className="stat-label">Platforms</div>
                </Card>
              </>
            ) : null}
          </div>
        </div>
      </section>

      {/* Quick actions */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="section-inner">
          <h2 className="section-heading">Quick Actions</h2>
          <div className="quick-grid stagger">
            <Link to="/match" className="quick-card">
              <Card hoverable>
                <div className="quick-icon">&#x1F3AF;</div>
                <h3>Match a Brief</h3>
                <p className="text-secondary">Submit a client brief and find matching creators</p>
              </Card>
            </Link>
            <Link to="/creators" className="quick-card">
              <Card hoverable>
                <div className="quick-icon">&#x1F3AC;</div>
                <h3>Browse Creators</h3>
                <p className="text-secondary">Explore the full creator database with filters</p>
              </Card>
            </Link>
            <Link to="/admin" className="quick-card">
              <Card hoverable>
                <div className="quick-icon">&#x1F31F;</div>
                <h3>Golden Records</h3>
                <p className="text-secondary">Manage benchmark creators and the lookalike model</p>
              </Card>
            </Link>
            <Link to="/status" className="quick-card">
              <Card hoverable>
                <div className="quick-icon">&#x1F4CA;</div>
                <h3>System Status</h3>
                <p className="text-secondary">Check service health and API connectivity</p>
              </Card>
            </Link>
          </div>
        </div>
      </section>

      {/* Craft distribution */}
      {topCrafts.length > 0 && (
        <section className="section-elevated">
          <div className="section-inner">
            <h2 className="section-heading">Craft Distribution</h2>
            <div className="craft-bars stagger">
              {topCrafts.map(([craft, count]) => (
                <div key={craft} className="craft-bar-row">
                  <span className="craft-bar-label">{craft.replace(/_/g, ' ')}</span>
                  <div className="craft-bar-track">
                    <div
                      className="craft-bar-fill"
                      style={{ width: `${(count / (stats?.totalCreators || 1)) * 100}%` }}
                    />
                  </div>
                  <span className="craft-bar-count">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
