/**
 * @file CreatorProfile.tsx
 * @description Creator detail page – Beta Control Center design system
 * @author Charley Scholz, JLIT
 * @coauthor Claude Opus 4.6, Claude Code (coding assistant), Cursor (IDE)
 * @updated 2026-02-19
 */

import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api, type Creator, type SemanticSearchResult, type LookalikeScoreResponse } from '../api/client';
import '../components/ui/ui.css';
import './CreatorProfile.css';

export default function CreatorProfile() {
  const { id } = useParams<{ id: string }>();
  const [creator, setCreator] = useState<Creator | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [similar, setSimilar] = useState<SemanticSearchResult[]>([]);
  const [grScore, setGrScore] = useState<LookalikeScoreResponse | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    api
      .getCreator(id)
      .then((r) => {
        setCreator(r.creator);
        if (r.creator.embedding) {
          api.getSimilar(id, 5).then((s) => setSimilar(s.similar)).catch(() => {});
          api.scoreLookalike(id).then(setGrScore).catch(() => {});
        }
      })
      .catch((e) => {
        console.error(e);
        setError(e instanceof Error ? e.message : 'Failed to load creator');
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="profile-page">
        <div className="loading">
          <div className="spinner" />
          Loading...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-page">
        <Link to="/creators" className="profile-back">
          &larr; Back to Creators
        </Link>
        <div className="error-banner">
          {error}
        </div>
      </div>
    );
  }

  if (!creator) {
    return (
      <div className="profile-page">
        <Link to="/creators" className="profile-back">
          &larr; Back to Creators
        </Link>
        <div className="error-banner">
          Creator not found
        </div>
      </div>
    );
  }

  const qualityScore = creator.matching?.qualityScore ?? 0;

  return (
    <div className="profile-page">
      <Link to="/creators" className="profile-back">
        &larr; Back to Creators
      </Link>

      {/* Profile Header Card */}
      <div className="profile-card">
        <div className="profile-header">
          <div>
            <div className="profile-name-row">
              <h1 className="profile-name">{creator.name}</h1>
              {creator.matching?.isGoldenRecord && (
                <span className="golden-tag">Golden Record</span>
              )}
            </div>
            {creator.handle && (
              <div className="profile-handle">{creator.handle}</div>
            )}
            <div className="profile-meta">
              {creator.craft?.primary && (
                <span className="badge badge-default">
                  {creator.craft.primary.replace(/_/g, ' ')}
                </span>
              )}
              <span className="badge badge-info">{creator.platform}</span>
              {creator.contact?.location && (
                <span className="profile-location">{creator.contact.location}</span>
              )}
            </div>
          </div>
          <div className="profile-actions">
            {creator.contact?.portfolio_url && (
              <a
                href={creator.contact.portfolio_url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary btn-md"
              >
                View Portfolio
              </a>
            )}
            {creator.contact?.email && (
              <a
                href={`mailto:${creator.contact.email}`}
                className="btn btn-secondary btn-md"
              >
                Contact
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Style Signature Card */}
      {creator.craft?.styleSignature && (
        <div className="profile-card style-sig-card">
          <h3 className="style-sig-label">Style Signature</h3>
          <p className="style-sig-text">{creator.craft.styleSignature}</p>
        </div>
      )}

      {/* Golden Record Similarity (prominent) */}
      {grScore && (
        <div className="profile-card gr-score-card">
          <span className="detail-label">Golden Record Similarity</span>
          <span className="score-value gr-score-value">
            {(grScore.goldenRecordSimilarity * 100).toFixed(1)}%
          </span>
        </div>
      )}

      {/* Details Section */}
      <div className="profile-card">
        <div className="profile-details">
          <div className="detail-column">
            <h2 className="detail-section-title">Craft Details</h2>
            <div className="detail-row">
              <span className="detail-label">Primary Craft</span>
              <span>{creator.craft?.primary?.replace(/_/g, ' ') || 'N/A'}</span>
            </div>
            {creator.craft?.secondary && creator.craft.secondary.length > 0 && (
              <div className="detail-row">
                <span className="detail-label">Secondary</span>
                <span>{creator.craft.secondary.join(', ')}</span>
              </div>
            )}
            {creator.craft?.primaryMedium && (
              <div className="detail-row">
                <span className="detail-label">Primary Medium</span>
                <span>{creator.craft.primaryMedium}</span>
              </div>
            )}
            {creator.craft?.classification && (
              <div className="detail-row">
                <span className="detail-label">Classification</span>
                <span>{creator.craft.classification}</span>
              </div>
            )}
            <div className="detail-row">
              <span className="detail-label">Quality Score</span>
              <span className="score-inline">
                <span className="craft-bar-bg" style={{ width: 120 }}>
                  <span
                    className="craft-bar"
                    style={{
                      width: `${qualityScore}%`,
                      background:
                        qualityScore >= 80
                          ? 'var(--color-success)'
                          : qualityScore >= 50
                            ? 'var(--accent-gold)'
                            : 'var(--text-muted)',
                    }}
                  />
                </span>
                <strong>{qualityScore}</strong>
              </span>
            </div>
          </div>

          <div className="detail-column">
            <h2 className="detail-section-title">Technical Tags</h2>
            {creator.craft?.technicalTags && creator.craft.technicalTags.length > 0 ? (
              <div className="tags-cloud">
                {creator.craft.technicalTags.map((t) => (
                  <span key={t} className="tag">
                    {t}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-muted">No technical tags</p>
            )}

            {creator.matching?.positiveKeywords &&
              creator.matching.positiveKeywords.length > 0 && (
                <>
                  <h3 className="sub-heading">Positive Keywords</h3>
                  <div className="tags-cloud">
                    {creator.matching.positiveKeywords.map((k) => (
                      <span key={k} className="badge badge-success">
                        {k}
                      </span>
                    ))}
                  </div>
                </>
              )}

            {creator.craft?.subjectMatterTags &&
              creator.craft.subjectMatterTags.length > 0 && (
                <>
                  <h3 className="sub-heading">Subject Matter</h3>
                  <div className="tags-cloud">
                    {creator.craft.subjectMatterTags.map((t) => (
                      <span key={t} className="tag">
                        {t}
                      </span>
                    ))}
                  </div>
                </>
              )}
          </div>
        </div>
      </div>

      {/* Similar Creators */}
      {similar.length > 0 && (
        <div className="similar-section">
          <h2 className="section-heading">Similar Creators</h2>
          <div className="similar-grid stagger">
            {similar.map((s) => (
              <Link key={s.id} to={`/creators/${s.id}`} className="golden-card-link">
                <div className="golden-card">
                  <div className="golden-name">{s.name}</div>
                  {s.isGoldenRecord && (
                    <span className="golden-tag">Golden</span>
                  )}
                  <div className="golden-craft">
                    {s.craft?.replace(/_/g, ' ') ?? 'Creator'}
                  </div>
                  <div className="similarity-score">
                    Similarity: <strong>{(s.similarity * 100).toFixed(1)}%</strong>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Source Info */}
      {creator.source && (
        <div className="section-elevated">
          <h2 className="section-heading">Source Information</h2>
          <div className="source-details">
            {creator.source.type && (
              <div className="detail-row">
                <span className="detail-label">Source Type</span>
                <span>{creator.source.type}</span>
              </div>
            )}
            {creator.source.name && (
              <div className="detail-row">
                <span className="detail-label">Source</span>
                <span>{creator.source.name}</span>
              </div>
            )}
            {creator.source.url && (
              <div className="detail-row">
                <span className="detail-label">URL</span>
                <a
                  href={creator.source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {creator.source.url}
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
