/**
 * @file briefTemplates.ts
 * @description Pre-built creative brief templates for discovery UX
 * @author Charley Scholz, JLAI
 * @coauthor Claude Opus 4.6, Cursor (IDE)
 * @created 2026-02-23
 * @updated 2026-02-23
 */

export interface BriefTemplate {
  id: string;
  title: string;
  description: string;
  query: string;
  category: string;
}

export const BRIEF_CATEGORIES = [
  'Fashion & Editorial',
  'Tech & Innovation',
  'Music & Entertainment',
  'Branding',
  'Film & Documentary',
] as const;

export const briefTemplates: BriefTemplate[] = [
  {
    id: 'fashion-moody-cinema',
    title: 'Moody Fashion Film',
    description: 'Natural light cinematography with an editorial edge for high-fashion storytelling.',
    query: 'Moody cinematography for fashion film with natural lighting and editorial color grading',
    category: 'Fashion & Editorial',
  },
  {
    id: 'fashion-beauty-campaign',
    title: 'Beauty Campaign Visuals',
    description: 'Intimate close-up work with soft lighting for luxury beauty and skincare brands.',
    query: 'Beauty and skincare campaign cinematographer with intimate macro detail and soft lighting',
    category: 'Fashion & Editorial',
  },
  {
    id: 'tech-motion-launch',
    title: 'Tech Brand Launch',
    description: 'Bold motion graphics and 3D renders for a product reveal or brand manifesto.',
    query: 'Bold motion graphics and 3D product visualization for tech brand launch video',
    category: 'Tech & Innovation',
  },
  {
    id: 'tech-explainer',
    title: 'SaaS Explainer',
    description: 'Clean, dynamic animation that makes complex software feel effortless.',
    query: 'Clean animated explainer video style with dynamic transitions for SaaS product demo',
    category: 'Tech & Innovation',
  },
  {
    id: 'music-visual-album',
    title: 'Visual Album Director',
    description: 'Narrative-driven music video direction with bold color and choreographed movement.',
    query: 'Music video director with bold visual style and narrative-driven choreography',
    category: 'Music & Entertainment',
  },
  {
    id: 'music-live-concert',
    title: 'Live Concert Visuals',
    description: 'Multi-camera concert capture with real-time VJ graphics and immersive editing.',
    query: 'Live concert multi-camera cinematographer with immersive visual effects and VJ aesthetics',
    category: 'Music & Entertainment',
  },
  {
    id: 'brand-manifesto',
    title: 'Brand Manifesto',
    description: 'Cinematic brand storytelling that builds emotional resonance and cultural relevance.',
    query: 'Cinematic brand manifesto director with emotional storytelling and cultural narrative',
    category: 'Branding',
  },
  {
    id: 'brand-social-content',
    title: 'Social-First Content',
    description: 'Scroll-stopping short-form content designed for Instagram Reels and TikTok.',
    query: 'Short-form social content creator for Instagram Reels and TikTok with bold pacing and text animation',
    category: 'Branding',
  },
  {
    id: 'doc-nonprofit',
    title: 'Non-Profit Documentary',
    description: 'Authentic documentary filmmaking that gives voice to mission-driven organizations.',
    query: 'Documentary-style short film director for non-profit with authentic interview and field footage',
    category: 'Film & Documentary',
  },
  {
    id: 'doc-branded-series',
    title: 'Branded Docu-Series',
    description: 'Episodic documentary content that blends brand narrative with real human stories.',
    query: 'Branded documentary series director with episodic storytelling and cinematic interviews',
    category: 'Film & Documentary',
  },
];
