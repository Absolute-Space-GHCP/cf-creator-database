/**
 * @file BriefTemplateSelector.tsx
 * @description Template card grid that helps users discover search queries
 * @author Charley Scholz, JLAI
 * @coauthor Claude Opus 4.6, Cursor (IDE)
 * @created 2026-02-23
 * @updated 2026-02-23
 */

import { briefTemplates, BRIEF_CATEGORIES } from '../../data/briefTemplates.js';
import type { BriefTemplate } from '../../data/briefTemplates.js';
import './BriefTemplateSelector.css';

interface BriefTemplateSelectorProps {
  onSelect: (query: string) => void;
}

export default function BriefTemplateSelector({ onSelect }: BriefTemplateSelectorProps) {
  const grouped = new Map<string, BriefTemplate[]>();
  for (const cat of BRIEF_CATEGORIES) {
    grouped.set(cat, briefTemplates.filter((t) => t.category === cat));
  }

  return (
    <div className="brief-templates">
      <div className="brief-templates-heading">
        <span className="brief-templates-label">Start with a template</span>
        <span className="brief-templates-rule" />
      </div>

      {BRIEF_CATEGORIES.map((category) => {
        const items = grouped.get(category);
        if (!items?.length) return null;
        return (
          <div key={category} className="brief-category">
            <h4 className="brief-category-name">{category}</h4>
            <div className="brief-category-grid">
              {items.map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  className="brief-card"
                  onClick={() => onSelect(tpl.query)}
                  aria-label={`Use template: ${tpl.title}`}
                >
                  <div className="brief-card-title">{tpl.title}</div>
                  <div className="brief-card-desc">{tpl.description}</div>
                  <span className="brief-card-arrow" aria-hidden="true">&#8594;</span>
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
