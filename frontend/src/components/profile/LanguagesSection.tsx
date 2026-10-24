import React from 'react';
import type { LanguageItem } from '../../types/v2';
import { Plus, Trash2, Globe, Award } from 'lucide-react';

interface Props {
  items: LanguageItem[];
  onAdd: (item: Partial<LanguageItem>) => void;
  onUpdate: (id: string, item: Partial<LanguageItem>) => void;
  onRemove: (id: string) => void;
}

export const LanguagesSection: React.FC<Props> = ({ items, onAdd, onUpdate, onRemove }) => {
  const handleAddDefault = () => {
    onAdd({
      name: '',
      level: 'Professional Working Proficiency',
    });
  };

  return (
    <div className="profile-section-body">
      {items.length === 0 ? (
        <div className="empty-section-prompt">
          <Globe size={36} className="empty-icon" />
          <p className="empty-title">No languages recorded yet</p>
          <p className="empty-desc">
            Add foreign or native languages you speak and your proficiency level.
          </p>
          <button type="button" className="btn btn-primary" onClick={handleAddDefault}>
            <Plus size={16} /> Add Language
          </button>
        </div>
      ) : (
        <div className="entries-list">
          {items.map((lang, index) => (
            <div key={lang.id} className="entry-card card" style={{ padding: '12px 16px' }}>
              <div className="grid-2-col" style={{ alignItems: 'flex-end', marginBottom: 0 }}>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label><Globe size={14} /> Language Name</label>
                  <input
                    className="input"
                    value={lang.name || ''}
                    onChange={(e) => onUpdate(lang.id, { name: e.target.value })}
                    placeholder="e.g. Spanish, German, Japanese"
                  />
                </div>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label><Award size={14} /> Proficiency Level</label>
                  <select
                    className="input"
                    value={lang.level || ''}
                    onChange={(e) => onUpdate(lang.id, { level: e.target.value })}
                  >
                    <option value="Native or Bilingual">Native or Bilingual</option>
                    <option value="Full Professional Proficiency">Full Professional Proficiency</option>
                    <option value="Professional Working Proficiency">Professional Working Proficiency</option>
                    <option value="Limited Working Proficiency">Limited Working Proficiency</option>
                    <option value="Elementary Proficiency">Elementary Proficiency</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm delete-btn"
                  onClick={() => onRemove(lang.id)}
                  title="Remove language"
                >
                  <Trash2 size={13} /> Remove
                </button>
              </div>
            </div>
          ))}

          <button type="button" className="btn btn-secondary add-entry-btn" onClick={handleAddDefault}>
            <Plus size={16} /> Add Another Language
          </button>
        </div>
      )}
    </div>
  );
};
