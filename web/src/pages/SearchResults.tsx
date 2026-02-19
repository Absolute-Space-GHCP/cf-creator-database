import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api, type SemanticSearchResult } from '../api/client';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import SearchBar from '../components/ui/SearchBar';
import Skeleton from '../components/ui/Skeleton';
import './SearchResults.css';

export default function SearchResults() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [results, setResults] = useState<SemanticSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [totalSearched, setTotalSearched] = useState(0);

  useEffect(() => {
    if (query) doSearch(query);
  }, [query]);

  async function doSearch(q: string) {
    setLoading(true);
    setSearched(false);
    try {
      const res = await api.searchSemantic(q, 20);
      setResults(res.results);
      setTotalSearched(res.totalSearched);
    } catch (err) {
      console.error(err);
      setResults([]);
    } finally {
      setLoading(false);
      setSearched(true);
    }
  }

  function handleSearch(q: string) {
    setSearchParams({ q });
  }

  return (
    <div className="search-page page">
      <h1>Semantic Search</h1>
      <p className="search-description">
        Search creators by meaning, not just keywords. Powered by AI embeddings.
      </p>

      <div className="search-bar-wrapper">
        <SearchBar
          placeholder="Describe the type of creator you're looking for..."
          onSearch={handleSearch}
          defaultValue={query}
          loading={loading}
        />
      </div>

      {loading && (
        <div className="search-results-grid">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <Skeleton height="1.5rem" width="60%" />
              <Skeleton height="1rem" width="40%" className="mt-2" />
            </Card>
          ))}
        </div>
      )}

      {!loading && searched && results.length === 0 && (
        <div className="empty-state">
          <h3>No results found</h3>
          <p>Try a different search query or broaden your description</p>
        </div>
      )}

      {!loading && results.length > 0 && (
        <>
          <div className="search-meta">
            {results.length} results from {totalSearched} creators with embeddings
          </div>
          <div className="search-results-grid stagger">
            {results.map((r) => (
              <Link key={r.id} to={`/creators/${r.id}`} className="creator-card-link">
                <Card hoverable className="search-result-card">
                  <div className="creator-card-header">
                    <h3 className="creator-card-name">{r.name}</h3>
                    {r.isGoldenRecord && <Badge variant="gold">Golden</Badge>}
                  </div>
                  {r.handle && <div className="creator-card-handle">{r.handle}</div>}
                  <div className="creator-card-meta">
                    {r.craft && <Badge variant="default">{r.craft.replace(/_/g, ' ')}</Badge>}
                    {r.platform && <Badge variant="info">{r.platform}</Badge>}
                    {r.location && <span className="text-muted">{r.location}</span>}
                  </div>
                  <div className="search-similarity">
                    <div className="score-bar" style={{ flex: 1 }}>
                      <div
                        className="score-bar-fill"
                        style={{
                          width: `${r.similarity * 100}%`,
                          background: 'var(--color-gold)',
                        }}
                      />
                    </div>
                    <span className="score-value">{(r.similarity * 100).toFixed(1)}%</span>
                  </div>
                  {r.styleSignature && (
                    <p className="search-style-sig">{r.styleSignature}</p>
                  )}
                </Card>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
