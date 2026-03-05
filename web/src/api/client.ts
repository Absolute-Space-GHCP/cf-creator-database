/**
 * @file client.ts
 * @description Typed API client for CatchFire Matching Engine
 * @author Charley Scholz, JLAI
 * @coauthor Claude Opus 4.6, Claude Code (coding assistant), Cursor (IDE)
 * @created 2026-01-28
 * @updated 2026-03-05
 */

const BASE = import.meta.env.VITE_API_BASE ?? '';
const TOKEN_KEY = 'cf-auth-token';

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem(TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export class ApiError extends Error {
  status: number;
  isNetwork: boolean;

  constructor(message: string, status: number, isNetwork = false) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.isNetwork = isNetwork;
  }

  get isServerError() { return this.status >= 500; }
  get isClientError() { return this.status >= 400 && this.status < 500; }
  get isTransient() { return this.isNetwork || this.isServerError; }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      headers: { 'Content-Type': 'application/json', ...authHeaders(), ...init?.headers },
      ...init,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Network error';
    throw new ApiError(
      navigator.onLine === false ? 'You appear to be offline' : `Network error: ${msg}`,
      0,
      true,
    );
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new ApiError(body.error ?? `Request failed: ${res.status}`, res.status);
  }
  return res.json();
}

/* ── Shared types ──────────────────────────────────────── */

export interface WorkPiece {
  title: string;
  url: string;
  type: 'portfolio' | 'reel' | 'project' | 'festival_entry' | 'award' | 'article' | 'interview';
  description?: string;
  year?: number;
}

export interface Creator {
  id: string;
  name: string;
  handle?: string;
  platform: string;
  source?: { type?: string; name?: string; url?: string; discoveredAt?: string };
  craft?: {
    primary?: string;
    secondary?: string[];
    styleSignature?: string;
    technicalTags?: string[];
    subjectMatterTags?: string[];
    subjectSubcategoryTags?: string[];
    primaryMedium?: string;
    classification?: string;
  };
  matching?: {
    positiveKeywords?: string[];
    negativeKeywords?: string[];
    qualityScore?: number;
    isGoldenRecord?: boolean;
    lastVerified?: string;
  };
  contact?: {
    email?: string;
    portfolio_url?: string;
    location?: string;
    locationConstraints?: string;
    rateRange?: string;
    budgetTier?: string;
    isHireable?: boolean;
  };
  work?: WorkPiece[];
  embedding?: number[];
  embeddingModel?: string;
  embeddingGeneratedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface HealthResponse {
  status: string;
  app: string;
  version: string;
  timestamp: string;
  config: { projectId: string; region: string; model: string; collection: string };
}

export interface StatsResponse {
  success: boolean;
  stats: {
    totalCreators: number;
    goldenRecords: number;
    byCraft: Record<string, number>;
    byPlatform: Record<string, number>;
    cacheAge: string;
  };
}

export interface CreatorsListResponse {
  success: boolean;
  count: number;
  creators: Creator[];
}

export interface CreatorResponse {
  success: boolean;
  creator: Creator;
}

export interface MatchResult {
  creator?: Creator;
  id?: string;
  name?: string;
  handle?: string;
  craft?: string;
  platform?: string;
  matchScore: number;
  matchBreakdown: Record<string, number>;
  matchReasons: string[];
  isGoldenRecord?: boolean;
  location?: string;
  styleSignature?: string;
  work?: WorkPiece[];
  source?: { type?: string; name?: string; url?: string; discoveredAt?: string };
}

export interface MatchResponse {
  success: boolean;
  brief: string;
  extractedKeywords: {
    crafts: string[];
    technical: string[];
    locations: string[];
    styles: string[];
    subjects: string[];
    primaryMediumHint: string | null;
  };
  matchCount: number;
  matches: MatchResult[];
}

export interface SemanticSearchResult {
  id: string;
  name: string;
  handle?: string;
  craft?: string;
  platform?: string;
  location?: string;
  similarity: number;
  styleSignature?: string;
  isGoldenRecord?: boolean;
}

export interface SemanticSearchResponse {
  success: boolean;
  query: string;
  results: SemanticSearchResult[];
  totalSearched: number;
  embeddingModel: string;
}

export interface LookalikeModelResponse {
  success: boolean;
  model: {
    goldenRecordCount: number;
    dimensions: number;
    goldenRecords: { id: string; name: string; craft?: string }[];
    createdAt: string;
    cacheAge: string | null;
  } | null;
  message?: string;
}

export interface LookalikeScoreResponse {
  success: boolean;
  creator: { id: string; name: string; craft?: string; isGoldenRecord: boolean };
  goldenRecordSimilarity: number;
  comparedAgainst: number;
  individualScores: { id: string; name: string; craft?: string; similarity: number }[];
}

export interface LLMTestResponse {
  success: boolean;
  connected: boolean;
  model: string;
  message: string;
}

export interface EmbeddingTestResponse {
  success: boolean;
  model: string;
  dimensions: number;
  clientType: string;
  error?: string | null;
}

export interface FeedbackPayload {
  event: 'match' | 'semantic';
  briefOrQuery: string;
  sessionId?: string;
  resultId?: string;
  creatorId?: string;
  rating: 'up' | 'down';
  comment?: string;
}

/* ── Image Analysis types ─────────────────────────────── */

export interface ImageAnalysis {
  technicalTags: string[];
  styleKeywords: string[];
  subjectMatter: string[];
  colorPalette: string[];
  moodDescriptor: string;
  equipmentGuess: string[];
}

export interface ImageAnalysisPreviewResponse {
  success: boolean;
  imageUrl: string;
  analysis: ImageAnalysis;
  model: string;
}

export interface ImageAnalysisCreatorResponse {
  success: boolean;
  creatorId: string;
  analysis: ImageAnalysis;
  mergedTags: {
    technicalTags: string[];
    subjectMatterTags: string[];
  };
  creator: Creator;
}

/* ── Scraper types ────────────────────────────────────── */

export interface ScraperReport {
  id: string;
  timestamp: string;
  platforms: string[];
  status: string;
  creatorsFound: number;
  creatorsImported: number;
  duration: number;
  error: string | null;
  triggeredBy: string;
  dryRun?: boolean;
}

export interface ScraperStatusResponse {
  success: boolean;
  lastRun: ScraperReport | null;
  totalRuns: number;
}

export interface ScraperReportsResponse {
  success: boolean;
  reports: ScraperReport[];
}

export interface ScraperTriggerResponse {
  success: boolean;
  runId: string;
  dryRun: boolean;
  creatorsFound: number;
  creatorsTransformed: number;
  creatorsImported: number;
  transformErrors: number;
  duration: number;
  platforms: string[];
}

/* ── Enrichment types ───────────────────────────────────── */

export interface EnrichmentStatusResponse {
  success: boolean;
  status: 'ready' | 'awaiting_configuration';
  message: string;
  config: {
    provider: string | null;
    availableProviders: string[];
    envVars: Record<string, string>;
  };
}

export interface EnrichmentResponse {
  success: boolean;
  error?: string;
  status?: 'awaiting_configuration' | 'not_implemented';
  creatorId?: string;
}

/* ── API functions ─────────────────────────────────────── */

export const api = {
  getHealth: () => request<HealthResponse>('/health'),

  getAuthMe: () => request<{ success: boolean; authenticated: boolean; method?: string; email?: string }>('/api/v1/auth/me'),

  getStats: () => request<StatsResponse>('/api/v1/stats'),

  getCreators: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<CreatorsListResponse>(`/api/v1/creators${qs}`);
  },

  getCreator: (id: string, opts?: { includeWork?: boolean; includeSource?: boolean }) => {
    const params = new URLSearchParams();
    if (opts?.includeWork) params.set('includeWork', 'true');
    if (opts?.includeSource) params.set('includeSource', 'true');
    const qs = params.toString();
    return request<CreatorResponse>(`/api/v1/creators/${id}${qs ? '?' + qs : ''}`);
  },

  patchCreator: (id: string, data: Partial<Creator>) =>
    request<{ success: boolean }>(`/api/v1/creators/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  searchSemantic: (query: string, options?: { limit?: number; filters?: Record<string, unknown> }) =>
    request<SemanticSearchResponse>('/api/v1/search/semantic', {
      method: 'POST',
      body: JSON.stringify({ query, limit: options?.limit ?? 10, filters: options?.filters }),
    }),

  matchBrief: (brief: string, filters?: Record<string, unknown>, opts?: { includeWorkLinks?: boolean; includeSourceLinks?: boolean }) =>
    request<MatchResponse>('/api/v1/match', {
      method: 'POST',
      body: JSON.stringify({ brief, filters, includeWorkLinks: opts?.includeWorkLinks, includeSourceLinks: opts?.includeSourceLinks }),
    }),

  submitFeedback: (data: FeedbackPayload) =>
    request<{ success: boolean }>('/api/v1/feedback', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getLookalikeModel: () =>
    request<LookalikeModelResponse>('/api/v1/lookalikes/model'),

  scoreLookalike: (id: string) =>
    request<LookalikeScoreResponse>(`/api/v1/lookalikes/score/${id}`),

  refreshLookalikeModel: () =>
    request<{ success: boolean; goldenRecordCount?: number }>('/api/v1/lookalikes/refresh', {
      method: 'POST',
    }),

  testLLM: () => request<LLMTestResponse>('/api/v1/llm/test'),

  testEmbeddings: () => request<EmbeddingTestResponse>('/api/v1/embeddings/test'),

  getSimilar: (id: string, limit = 5) =>
    request<{ success: boolean; target: { id: string; name: string }; similar: SemanticSearchResult[] }>(
      `/api/v1/similar/${id}?limit=${limit}`
    ),

  getScraperStatus: () =>
    request<ScraperStatusResponse>('/api/v1/scraper/status'),

  getScraperReports: () =>
    request<ScraperReportsResponse>('/api/v1/scraper/reports'),

  triggerScrape: (platforms?: string[], limit?: number) =>
    request<ScraperTriggerResponse>('/api/v1/scraper/trigger', {
      method: 'POST',
      body: JSON.stringify({ platforms, limit }),
    }),

  analyzeImagePreview: (imageUrl: string) =>
    request<ImageAnalysisPreviewResponse>('/api/v1/analyze-image', {
      method: 'POST',
      body: JSON.stringify({ imageUrl }),
    }),

  analyzeCreatorImage: (creatorId: string, imageUrl: string) =>
    request<ImageAnalysisCreatorResponse>(`/api/v1/creators/${creatorId}/analyze-image`, {
      method: 'POST',
      body: JSON.stringify({ imageUrl }),
    }),

  getEnrichmentStatus: () =>
    request<EnrichmentStatusResponse>('/api/v1/enrichment/status'),

  enrichCreator: (id: string) =>
    request<EnrichmentResponse>(`/api/v1/enrichment/enrich/${id}`, {
      method: 'POST',
    }),
};
