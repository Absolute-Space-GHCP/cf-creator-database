/**
 * @file Admin.tsx
 * @description Golden Records Admin page – manage benchmark creators for lookalike model
 * @author Charley Scholz, JLIT
 * @coauthor Claude Opus 4.6, Claude Code (coding assistant), Cursor (IDE)
 * @created 2026-01-28
 * @updated 2026-02-19
 */

import { useEffect, useState, useCallback } from 'react';
import { api, type Creator, type LookalikeModelResponse } from '../api/client';
import './Admin.css';

export default function Admin() {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const [model, setModel] = useState<LookalikeModelResponse['model']>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'craft' | 'score'>('name');
  const [toggling, setToggling] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [creatorsRes, modelRes] = await Promise.all([
        api.getCreators({ limit: '200' }),
        api.getLookalikeModel(),
      ]);
      setCreators(creatorsRes.creators);
      setModel(modelRes.model);
    } catch (e) {
      console.error(e);
      setError('Failed to load creators and model data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function toggleGoldenRecord(creator: Creator) {
    setToggling(creator.id);
    setError(null);
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
      setError(`Failed to update Golden Record status for ${creator.name}.`);
    } finally {
      setToggling(null);
    }
  }

  async function handleRefreshModel() {
    setRefreshing(true);
    setError(null);
    try {
      await api.refreshLookalikeModel();
      const modelRes = await api.getLookalikeModel();
      setModel(modelRes.model);
    } catch (e) {
      console.error(e);
      setError('Failed to refresh lookalike model.');
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
    <div className="admin-page">
      <h1>Golden Records Admin</h1>
      <p className="admin-description">
        Manage benchmark creators. Golden Records define the quality standard for the
        lookalike matching model.
      </p>

      {error && (
        <div className="error-banner" role="alert">
          {error}
        </div>
      )}

      {/* Model info card */}
      <div className="model-card">
        <div className="model-card-header">
          <div className="card-icon">★</div>
          <h3 className="card-title">Lookalike Model</h3>
        </div>
        <div className="model-info">
          <div>
            {model ? (
              <p>
                Built from <strong className="text-gold">{model.goldenRecordCount}</strong>{' '}
                Golden Records · {model.dimensions}d embeddings
                {model.cacheAge && <> · Cached {model.cacheAge}</>}
              </p>
            ) : (
              <p className="text-muted">No model built yet. Mark Golden Records below to get started.</p>
            )}
          </div>
          <button
            type="button"
            className="btn-primary"
            onClick={handleRefreshModel}
            disabled={refreshing}
          >
            {refreshing ? 'Refreshing...' : 'Refresh Model'}
          </button>
        </div>

        {model?.goldenRecords && model.goldenRecords.length > 0 && (
          <div className="model-records">
            {model.goldenRecords.map((gr) => (
              <span key={gr.id} className="golden-tag">
                {gr.name}
              </span>
            ))}
          </div>
        )}
      </div>

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
            type="button"
            className={`sort-btn ${sortBy === s ? 'active' : ''}`}
            onClick={() => setSortBy(s)}
          >
            {s === 'score' ? 'Quality Score' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Creators table */}
      {loading ? (
        <div className="admin-loading">
          <div className="spinner" />
          <span>Loading creators...</span>
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
                    <span className="craft-badge">
                      {(c.craft?.primary || 'other').replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td>{c.platform}</td>
                  <td>
                    <span className="table-score">{c.matching?.qualityScore ?? '—'}</span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className={`toggle-btn ${c.matching?.isGoldenRecord ? 'on' : ''}`}
                      onClick={() => toggleGoldenRecord(c)}
                      disabled={toggling === c.id}
                      aria-label={c.matching?.isGoldenRecord ? 'Remove Golden Record' : 'Add Golden Record'}
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
