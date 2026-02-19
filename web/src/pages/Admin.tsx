import { useEffect, useState, useCallback } from 'react';
import { api, type Creator, type LookalikeModelResponse } from '../api/client';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Skeleton from '../components/ui/Skeleton';
import './Admin.css';

export default function Admin() {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const [model, setModel] = useState<LookalikeModelResponse['model']>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'craft' | 'score'>('name');
  const [toggling, setToggling] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [creatorsRes, modelRes] = await Promise.all([
        api.getCreators({ limit: '200' }),
        api.getLookalikeModel(),
      ]);
      setCreators(creatorsRes.creators);
      setModel(modelRes.model);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function toggleGoldenRecord(creator: Creator) {
    setToggling(creator.id);
    try {
      const newValue = !creator.matching?.isGoldenRecord;
      await api.patchCreator(creator.id, {
        matching: { ...creator.matching, isGoldenRecord: newValue },
      } as Partial<Creator>);
      setCreators((prev) =>
        prev.map((c) =>
          c.id === creator.id
            ? { ...c, matching: { ...c.matching, isGoldenRecord: newValue } }
            : c
        )
      );
    } catch (e) {
      console.error(e);
    } finally {
      setToggling(null);
    }
  }

  async function handleRefreshModel() {
    setRefreshing(true);
    try {
      await api.refreshLookalikeModel();
      const modelRes = await api.getLookalikeModel();
      setModel(modelRes.model);
    } catch (e) {
      console.error(e);
    } finally {
      setRefreshing(false);
    }
  }

  const goldenRecords = creators.filter((c) => c.matching?.isGoldenRecord);
  const sorted = [...creators].sort((a, b) => {
    if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '');
    if (sortBy === 'craft') return (a.craft?.primary || '').localeCompare(b.craft?.primary || '');
    return (b.matching?.qualityScore ?? 0) - (a.matching?.qualityScore ?? 0);
  });

  return (
    <div className="admin-page page">
      <h1>Golden Records Admin</h1>
      <p className="admin-description">
        Manage benchmark creators. Golden Records define the quality standard for the
        lookalike matching model.
      </p>

      {/* Model info */}
      <Card variant="dark" className="model-card">
        <div className="model-info">
          <div>
            <h3>Lookalike Model</h3>
            {model ? (
              <p>
                Built from <strong className="text-gold">{model.goldenRecordCount}</strong>{' '}
                Golden Records &middot; {model.dimensions}d embeddings
                {model.cacheAge && <> &middot; Cached {model.cacheAge}</>}
              </p>
            ) : (
              <p className="text-muted">No model built yet. Mark Golden Records below to get started.</p>
            )}
          </div>
          <Button
            variant="primary"
            onClick={handleRefreshModel}
            disabled={refreshing}
          >
            {refreshing ? 'Refreshing...' : 'Refresh Model'}
          </Button>
        </div>

        {model?.goldenRecords && model.goldenRecords.length > 0 && (
          <div className="model-records">
            {model.goldenRecords.map((gr) => (
              <Badge key={gr.id} variant="gold">{gr.name}</Badge>
            ))}
          </div>
        )}
      </Card>

      {/* Summary */}
      <div className="admin-summary">
        <span>{creators.length} total creators</span>
        <span className="text-gold">{goldenRecords.length} Golden Records</span>
      </div>

      {/* Sort controls */}
      <div className="admin-controls">
        <span className="sort-label">Sort by:</span>
        {(['name', 'craft', 'score'] as const).map((s) => (
          <button
            key={s}
            className={`sort-btn ${sortBy === s ? 'active' : ''}`}
            onClick={() => setSortBy(s)}
          >
            {s === 'score' ? 'Quality Score' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Creators table */}
      {loading ? (
        <div className="admin-table-skeleton">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} height="48px" />
          ))}
        </div>
      ) : (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Craft</th>
                <th>Platform</th>
                <th>Quality</th>
                <th>Golden Record</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((c) => (
                <tr key={c.id} className={c.matching?.isGoldenRecord ? 'golden-row' : ''}>
                  <td className="table-name">{c.name}</td>
                  <td>
                    <Badge variant="default">{(c.craft?.primary || 'other').replace(/_/g, ' ')}</Badge>
                  </td>
                  <td>{c.platform}</td>
                  <td>
                    <span className="table-score">{c.matching?.qualityScore ?? '—'}</span>
                  </td>
                  <td>
                    <button
                      className={`toggle-btn ${c.matching?.isGoldenRecord ? 'on' : 'off'}`}
                      onClick={() => toggleGoldenRecord(c)}
                      disabled={toggling === c.id}
                    >
                      <span className="toggle-track">
                        <span className="toggle-thumb" />
                      </span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
