import React from 'react';
import { Eye, EyeOff, Check } from 'lucide-react';

interface SectionVisibilityProps {
  visibility: Record<string, boolean>;
  onChange: (updatedVisibility: Record<string, boolean>) => void;
}

const sectionDefinitions: Array<{ key: string; label: string }> = [
  { key: 'summary', label: 'Professional Summary' },
  { key: 'experience', label: 'Work Experience' },
  { key: 'education', label: 'Education' },
  { key: 'skills', label: 'Skills & Tech Stack' },
  { key: 'projects', label: 'Key Projects' },
  { key: 'certifications', label: 'Certifications' },
  { key: 'languages', label: 'Languages' },
  { key: 'awards', label: 'Honors & Awards' },
  { key: 'custom_sections', label: 'Custom Sections' },
];

export const SectionVisibility: React.FC<SectionVisibilityProps> = ({
  visibility,
  onChange,
}) => {
  const toggleVisibility = (key: string) => {
    const current = visibility[key] !== false; // default true
    onChange({
      ...visibility,
      [key]: !current,
    });
  };

  return (
    <div className="section-visibility-panel">
      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 12px 0' }}>
        Show or hide entire sections in this resume view.
      </p>

      <div className="visibility-list">
        {sectionDefinitions.map((sec) => {
          const isVisible = visibility[sec.key] !== false;
          return (
            <div
              key={sec.key}
              className={`visibility-item ${isVisible ? 'is-visible' : 'is-hidden'}`}
              onClick={() => toggleVisibility(sec.key)}
              role="button"
              tabIndex={0}
            >
              <span className="visibility-label">{sec.label}</span>
              <button
                type="button"
                className={`visibility-toggle-btn ${isVisible ? 'active' : ''}`}
                title={isVisible ? 'Hide Section' : 'Show Section'}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleVisibility(sec.key);
                }}
              >
                {isVisible ? <Eye size={16} /> : <EyeOff size={16} />}
                <span>{isVisible ? 'Visible' : 'Hidden'}</span>
              </button>
            </div>
          );
        })}
      </div>

      <style>{`
        .section-visibility-panel {
          margin-bottom: 24px;
        }
        .visibility-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .visibility-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 14px;
          background: var(--bg-primary, #ffffff);
          border: 1px solid var(--border-light, #e2e8f0);
          border-radius: var(--radius-md, 8px);
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .visibility-item.is-hidden {
          opacity: 0.6;
          background: var(--bg-hover, #f8fafc);
        }
        .visibility-label {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-primary, #1e293b);
        }
        .visibility-toggle-btn {
          border: none;
          background: transparent;
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 500;
          color: var(--text-tertiary, #64748b);
          cursor: pointer;
        }
        .visibility-toggle-btn.active {
          color: var(--primary, #4f46e5);
        }
      `}</style>
    </div>
  );
};
