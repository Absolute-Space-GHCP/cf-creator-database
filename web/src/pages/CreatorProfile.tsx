import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api, type Creator, type SemanticSearchResult, type LookalikeScoreResponse } from '../api/client';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Tag from '../components/ui/Tag';
import Button from '../components/ui/Button';
import Skeleton from '../components/ui/Skeleton';
import './CreatorProfile.css';

export default function CreatorProfile() {
  const { id } = useParams<{ id: string }>();
  const [creator, setCreator] = useState<Creator | null>(null);
  const [loading, setLoading] = useState(true);
  const [similar, setSimilar] = useState<SemanticSearchResult[]>([]);
  const [grScore, setGrScore] = useState<LookalikeScoreResponse | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.getCreator(id)
      .then((r) => {
        setCreator(r.creator);
        if (r.creator.embedding) {
          api.getSimilar(id, 5).then((s) => setSimilar(s.similar)).catch(() => {});
          api.scoreLookalike(id).then(setGrScore).catch(() => {});
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="page">
        <Skeleton height="2rem" width="40%" />
        <Skeleton height="1rem" width="60%" className="mt-2" />
        <Skeleton height="200px" className="mt-2" />
      </div>
    );
  }

  if (!creator) {
    return (
      <div className="empty-state">
        <h3>Creator not found</h3>
        <Link to="/creators">Back to Browse</Link>
      </div>
    );
  }

  const qualityScore = creator.matching?.qualityScore ?? 0;

  return (
    <div className="profile-page">
      <section className="section profile-hero">
        <div className="profile-header">
          <div>
            <div className="profile-name-row">
              <h1>{creator.name}</h1>
              {creator.matching?.isGoldenRecord && <Badge variant="gold">Golden Record</Badge>}
            </div>
            {creator.handle && <div className="profile-handle">{creator.handle}</div>}
            <div className="profile-meta">
              {creator.craft?.primary && (
                <Badge variant="default">{creator.craft.primary.replace(/_/g, ' ')}</Badge>
              )}
              <Badge variant="info">{creator.platform}</Badge>
              {creator.contact?.location && (
                <span className="profile-location">{creator.contact.location}</span>
              )}
            </div>
          </div>
          <div className="profile-actions">
            {creator.contact?.portfolio_url && (
              <a href={creator.contact.portfolio_url} target="_blank" rel="noopener noreferrer">
                <Button variant="primary">View Portfolio &rarr;</Button>
              </a>
            )}
            {creator.contact?.email && (
              <a href={`mailto:${creator.contact.email}`}>
                <Button variant="secondary">Contact</Button>
              </a>
            )}
          </div>
        </div>
      </section>

      {creator.craft?.styleSignature && (
        <section className="section" style={{ paddingTop: 0 }}>
          <Card variant="dark" className="style-signature-card">
            <h3 className="style-sig-label">Style Signature</h3>
            <p className="style-sig-text">{creator.craft.styleSignature}</p>
          </Card>
        </section>
      )}

      <section className="section">
        <div className="section-inner profile-details">
          <div className="detail-column">
            <h2>Craft Details</h2>
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
                <span className="score-bar" style={{ width: 120 }}>
                  <span
                    className="score-bar-fill"
                    style={{
                      width: `${qualityScore}%`,
                      background: qualityScore >= 80 ? 'var(--color-success)' : qualityScore >= 50 ? 'var(--color-gold)' : 'var(--color-text-muted)',
                    }}
                  />
                </span>
                <strong>{qualityScore}</strong>
              </span>
            </div>
            {grScore && (
              <div className="detail-row">
                <span className="detail-label">Golden Record Similarity</span>
                <span className="text-gold" style={{ fontWeight: 600 }}>
                  {(grScore.goldenRecordSimilarity * 100).toFixed(1)}%
                </span>
              </div>
            )}
          </div>

          <div className="detail-column">
            <h2>Technical Tags</h2>
            {creator.craft?.technicalTags && creator.craft.technicalTags.length > 0 ? (
              <div className="tags-cloud">
                {creator.craft.technicalTags.map((t) => <Tag key={t}>{t}</Tag>)}
              </div>
            ) : (
              <p className="text-muted">No technical tags</p>
            )}

            {creator.matching?.positiveKeywords && creator.matching.positiveKeywords.length > 0 && (
              <>
                <h3 className="sub-heading">Positive Keywords</h3>
                <div className="tags-cloud">
                  {creator.matching.positiveKeywords.map((k) => (
                    <Badge key={k} variant="success">{k}</Badge>
                  ))}
                </div>
              </>
            )}

            {creator.craft?.subjectMatterTags && creator.craft.subjectMatterTags.length > 0 && (
              <>
                <h3 className="sub-heading">Subject Matter</h3>
                <div className="tags-cloud">
                  {creator.craft.subjectMatterTags.map((t) => <Tag key={t}>{t}</Tag>)}
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {similar.length > 0 && (
        <section className="section" style={{ paddingTop: 0 }}>
          <div className="section-inner">
            <h2 className="section-heading">Similar Creators</h2>
            <div className="similar-grid stagger">
              {similar.map((s) => (
                <Link key={s.id} to={`/creators/${s.id}`} className="creator-card-link">
                  <Card hoverable>
                    <div className="creator-card-header">
                      <h3 className="creator-card-name">{s.name}</h3>
                      {s.isGoldenRecord && <Badge variant="gold">Golden</Badge>}
                    </div>
                    <div className="creator-card-meta">
                      {s.craft && <Badge variant="default">{s.craft.replace(/_/g, ' ')}</Badge>}
                      {s.platform && <Badge variant="info">{s.platform}</Badge>}
                    </div>
                    <div className="similarity-score">
                      Similarity: <strong>{(s.similarity * 100).toFixed(1)}%</strong>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {creator.source && (
        <section className="section-elevated">
          <div className="section-inner">
            <h2 className="section-heading">Source Information</h2>
            <div className="source-details">
              {creator.source.type && <div><span className="detail-label">Source Type:</span> {creator.source.type}</div>}
              {creator.source.name && <div><span className="detail-label">Source:</span> {creator.source.name}</div>}
              {creator.source.url && (
                <div>
                  <span className="detail-label">URL:</span>{' '}
                  <a href={creator.source.url} target="_blank" rel="noopener noreferrer">{creator.source.url}</a>
                </div>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
