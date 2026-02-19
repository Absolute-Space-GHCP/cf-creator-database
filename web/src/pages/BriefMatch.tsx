import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api, type MatchResult, type MatchResponse } from '../api/client';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import './BriefMatch.css';

export default function BriefMatch() {
  const [brief, setBrief] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MatchResponse | null>(null);
  const [feedback, setFeedback] = useState<Record<string, 'up' | 'down'>>({});
  const [comment, setComment] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!brief.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await api.matchBrief(brief.trim());
      setResult(res);
      setFeedback({});
      setComment('');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function sendFeedback(match: MatchResult, rating: 'up' | 'down') {
    const creatorId = match.id || match.creator?.id || '';
    setFeedback((f) => ({ ...f, [creatorId]: rating }));
    try {
      await api.submitFeedback({
        event: 'match',
        briefOrQuery: brief,
        creatorId,
        rating,
        comment,
      });
    } catch {
      // feedback is best-effort
    }
  }

  return (
    <div className="match-page page">
      <h1>Match Creators to a Brief</h1>
      <p className="match-description">
        Describe the type of creator you're looking for. Our AI-powered scoring algorithm
        will rank the best matches from the database.
      </p>

      <form className="match-form" onSubmit={handleSubmit}>
        <textarea
          className="match-textarea"
          placeholder="e.g. We need a cinematographer who specializes in luxury automotive content. Should have experience with anamorphic lenses and a warm, editorial visual style. Based in or willing to travel to Los Angeles."
          value={brief}
          onChange={(e) => setBrief(e.target.value)}
          rows={5}
        />
        <Button type="submit" variant="primary" size="lg" disabled={!brief.trim() || loading}>
          {loading ? 'Matching...' : 'Match Creators'}
        </Button>
      </form>

      {result && (
        <div className="match-results fade-in">
          <div className="match-results-header">
            <h2>{result.matchCount} Matches Found</h2>
            <div className="match-keywords">
              {result.extractedKeywords.crafts.map((k) => (
                <Badge key={k} variant="default">{k}</Badge>
              ))}
              {result.extractedKeywords.locations.map((k) => (
                <Badge key={k} variant="info">{k}</Badge>
              ))}
              {result.extractedKeywords.styles.map((k) => (
                <Badge key={k} variant="gold">{k}</Badge>
              ))}
            </div>
          </div>

          <div className="match-list stagger">
            {result.matches.map((match, idx) => {
              const creatorId = match.id || match.creator?.id || String(idx);
              const name = match.name || match.creator?.name || 'Unknown';
              const craft = match.craft || match.creator?.craft?.primary;

              return (
                <Card key={creatorId} className="match-card">
                  <div className="match-card-rank">#{idx + 1}</div>
                  <div className="match-card-body">
                    <div className="match-card-header">
                      <Link to={`/creators/${creatorId}`} className="match-card-name">
                        {name}
                      </Link>
                      {match.isGoldenRecord && <Badge variant="gold">Golden</Badge>}
                    </div>
                    <div className="match-card-meta">
                      {craft && <Badge variant="default">{craft.replace(/_/g, ' ')}</Badge>}
                      {match.platform && <Badge variant="info">{match.platform}</Badge>}
                      {match.location && (
                        <span className="text-muted">{match.location}</span>
                      )}
                    </div>
                    {match.matchReasons.length > 0 && (
                      <ul className="match-reasons">
                        {match.matchReasons.slice(0, 3).map((r, i) => (
                          <li key={i}>{r}</li>
                        ))}
                      </ul>
                    )}
                    {match.styleSignature && (
                      <p className="match-style-sig">{match.styleSignature}</p>
                    )}
                  </div>
                  <div className="match-card-score-col">
                    <div className="match-score-value">{match.matchScore}</div>
                    <div className="match-score-label">Score</div>
                    <div className="match-feedback">
                      <button
                        className={`fb-btn fb-up ${feedback[creatorId] === 'up' ? 'active' : ''}`}
                        onClick={() => sendFeedback(match, 'up')}
                        title="Good match"
                      >
                        &#x1F44D;
                      </button>
                      <button
                        className={`fb-btn fb-down ${feedback[creatorId] === 'down' ? 'active' : ''}`}
                        onClick={() => sendFeedback(match, 'down')}
                        title="Poor match"
                      >
                        &#x1F44E;
                      </button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          <div className="match-comment-section">
            <label className="match-comment-label">Notes (optional)</label>
            <textarea
              className="match-comment"
              placeholder="Any overall feedback on the results..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={2}
            />
          </div>
        </div>
      )}
    </div>
  );
}
