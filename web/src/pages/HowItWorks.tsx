/**
 * @file HowItWorks.tsx
 * @description Animated workflow page showing how the Influencer Matching Engine works
 * @author Charley Scholz
 * @coauthor Claude Opus 4.6, Cursor (IDE)
 * @created 2026-02-19
 * @updated 2026-02-19
 */

import { useEffect, useState } from 'react';
import './HowItWorks.css';

interface Step {
  id: number;
  icon: string;
  title: string;
  description: string;
  details: string[];
  accent: string;
}

const STEPS: Step[] = [
  {
    id: 1,
    icon: '🔍',
    title: 'Source Discovery',
    description: 'We scrape the bottom 90% where professionals work, not the top 10% where influencers trend.',
    details: [
      'Film festivals (Camerimage, Annecy, Ciclope)',
      'Portfolio platforms (Vimeo, Behance, ArtStation)',
      'Professional communities (r/cinematography, r/vfx)',
      'Emerging talent hubs (The Rookies, NFFTY)',
    ],
    accent: 'var(--accent-gold)',
  },
  {
    id: 2,
    icon: '🤖',
    title: 'AI Categorization',
    description: 'Gemini AI reads each creator\'s bio, portfolio, and body of work to build a rich profile.',
    details: [
      'Primary craft detection (cinematographer, motion designer, etc.)',
      'Style signature generation — a prose summary of their aesthetic',
      'Technical tag extraction (#ArriAlexa, #HoudiniFX, #Anamorphic)',
      'Positive/negative keyword classification',
    ],
    accent: 'var(--accent-emerald)',
  },
  {
    id: 3,
    icon: '📐',
    title: 'Embedding Generation',
    description: 'Each creator profile is converted into a 768-dimension vector that captures meaning, not just keywords.',
    details: [
      'Gemini Embedding model (768 dimensions)',
      'Encodes craft, style, technical skills, and aesthetic sensibility',
      'Enables "find someone like X" similarity search',
      'Updates automatically when profiles change',
    ],
    accent: 'var(--accent-blue)',
  },
  {
    id: 4,
    icon: '⭐',
    title: 'Golden Record Calibration',
    description: 'Benchmark creators — handpicked by the Creative team — define what "great" looks like.',
    details: [
      '11 active Golden Records across 8 crafts',
      'Lookalike model built from Golden Record embeddings',
      'New creators scored against the benchmark set',
      'Continuously refined as more records are added',
    ],
    accent: 'var(--accent-gold)',
  },
  {
    id: 5,
    icon: '🎯',
    title: 'Brief Matching',
    description: 'Submit a client brief in natural language and get ranked creator recommendations.',
    details: [
      'Semantic search — understands meaning, not just keywords',
      '9-factor scoring: craft, location, tags, keywords, quality, golden fit',
      'Per-result reasoning ("Primary craft match: cinematographer")',
      'Thumbs up/down feedback to improve future results',
    ],
    accent: 'var(--accent-emerald)',
  },
  {
    id: 6,
    icon: '📊',
    title: 'Results & Export',
    description: 'Ranked results with detailed breakdowns, ready for stakeholder review.',
    details: [
      'Score breakdown per creator (why they matched)',
      'Download results as CSV for offline sharing',
      'Email curated lists directly to the team',
      'Dashboard analytics on match quality over time',
    ],
    accent: 'var(--accent-blue)',
  },
];

export default function HowItWorks() {
  const [visibleSteps, setVisibleSteps] = useState<Set<number>>(new Set());
  const [activeStep, setActiveStep] = useState<number | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setVisibleSteps(prev => {
        const next = new Set(prev);
        const nextId = prev.size + 1;
        if (nextId <= STEPS.length) {
          next.add(nextId);
        } else {
          clearInterval(timer);
        }
        return next;
      });
    }, 300);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="hiw-page">
      <section className="hiw-hero">
        <h1 className="hiw-title">
          How <em>CatchFire</em> Works
        </h1>
        <p className="hiw-subtitle">
          From source discovery to ranked recommendations — craft over clout, every step of the way.
        </p>
      </section>

      <section className="hiw-pipeline">
        <div className="pipeline-track" />
        {STEPS.map((step) => (
          <div
            key={step.id}
            className={`pipeline-step ${visibleSteps.has(step.id) ? 'visible' : ''} ${activeStep === step.id ? 'expanded' : ''}`}
            onClick={() => setActiveStep(activeStep === step.id ? null : step.id)}
          >
            <div className="step-connector">
              <div className="step-dot" style={{ borderColor: step.accent }}>
                <span className="step-number">{step.id}</span>
              </div>
              {step.id < STEPS.length && <div className="step-line" />}
            </div>
            <div className="step-card">
              <div className="step-card-header">
                <span className="step-icon">{step.icon}</span>
                <h3 className="step-title">{step.title}</h3>
                <span className="step-expand-hint">{activeStep === step.id ? '−' : '+'}</span>
              </div>
              <p className="step-description">{step.description}</p>
              <div className="step-details">
                {step.details.map((detail, i) => (
                  <div key={i} className="step-detail-item">
                    <span className="detail-bullet" style={{ background: step.accent }} />
                    <span>{detail}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </section>

      <section className="hiw-stats-bar">
        <div className="hiw-stat">
          <span className="hiw-stat-value">37</span>
          <span className="hiw-stat-label">Creators</span>
        </div>
        <div className="hiw-stat">
          <span className="hiw-stat-value">768</span>
          <span className="hiw-stat-label">Dimensions</span>
        </div>
        <div className="hiw-stat">
          <span className="hiw-stat-value">9</span>
          <span className="hiw-stat-label">Scoring Factors</span>
        </div>
        <div className="hiw-stat">
          <span className="hiw-stat-value">11</span>
          <span className="hiw-stat-label">Golden Records</span>
        </div>
      </section>

      <section className="hiw-flow-diagram">
        <h2 className="hiw-section-title">Data Flow</h2>
        <div className="flow-row">
          <div className="flow-box flow-sources">
            <div className="flow-box-icon">🌐</div>
            <div className="flow-box-label">Sources</div>
            <div className="flow-box-sub">Festivals, Platforms, Communities</div>
          </div>
          <div className="flow-arrow">
            <svg viewBox="0 0 60 24" className="arrow-svg">
              <path d="M0 12 H48 L40 4 M48 12 L40 20" fill="none" stroke="currentColor" strokeWidth="2" />
            </svg>
          </div>
          <div className="flow-box flow-engine">
            <div className="flow-box-icon">⚙️</div>
            <div className="flow-box-label">Engine</div>
            <div className="flow-box-sub">AI Categorize, Embed, Score</div>
          </div>
          <div className="flow-arrow">
            <svg viewBox="0 0 60 24" className="arrow-svg">
              <path d="M0 12 H48 L40 4 M48 12 L40 20" fill="none" stroke="currentColor" strokeWidth="2" />
            </svg>
          </div>
          <div className="flow-box flow-output">
            <div className="flow-box-icon">📋</div>
            <div className="flow-box-label">Output</div>
            <div className="flow-box-sub">Ranked Matches, Reports, API</div>
          </div>
        </div>
        <div className="flow-feedback-row">
          <svg viewBox="0 0 600 40" className="feedback-svg">
            <path d="M500 0 V20 H100 V40" fill="none" stroke="var(--accent-gold-dim)" strokeWidth="1.5" strokeDasharray="6 4" />
          </svg>
          <span className="flow-feedback-label">Feedback Loop (thumbs up/down refines scoring)</span>
        </div>
      </section>
    </div>
  );
}
