import React from 'react';
import type { AwardItem } from '../../types/v2';
import { Plus, Trash2, Trophy, Building, Calendar } from 'lucide-react';

interface Props {
  items: AwardItem[];
  onAdd: (item: Partial<AwardItem>) => void;
  onUpdate: (id: string, item: Partial<AwardItem>) => void;
  onRemove: (id: string) => void;
}

export const AwardsSection: React.FC<Props> = ({ items, onAdd, onUpdate, onRemove }) => {
  const handleAddDefault = () => {
    onAdd({
      title: '',
      issuer: '',
      date: '',
      description: '',
    });
  };

  return (
    <div className="profile-section-body">
      {items.length === 0 ? (
        <div className="empty-section-prompt">
          <Trophy size={36} className="empty-icon" />
          <p className="empty-title">No honors or awards recorded yet</p>
          <p className="empty-desc">
            Add hackathon wins, employee of the year recognitions, patents, or industry honors.
          </p>
          <button type="button" className="btn btn-primary" onClick={handleAddDefault}>
            <Plus size={16} /> Add Award
          </button>
        </div>
      ) : (
        <div className="entries-list">
          {items.map((award, index) => (
            <div key={award.id} className="entry-card card">
              <div className="entry-header">
                <div className="entry-title-area">
                  <span className="entry-badge">#{index + 1}</span>
                  <h4 className="entry-title-text">{award.title || 'Untitled Award'}</h4>
                  {award.issuer && <span className="entry-company-text">by {award.issuer}</span>}
                </div>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm delete-btn"
                  onClick={() => onRemove(award.id)}
                  title="Remove award"
                >
                  <Trash2 size={14} /> Remove
                </button>
              </div>

              <div className="grid-2-col">
                <div className="input-group">
                  <label><Trophy size={14} /> Award Title / Honor</label>
                  <input
                    className="input"
                    value={award.title || ''}
                    onChange={(e) => onUpdate(award.id, { title: e.target.value })}
                    placeholder="e.g. 1st Place - Global FinTech Hackathon"
                  />
                </div>
                <div className="input-group">
                  <label><Building size={14} /> Issuer / Organization</label>
                  <input
                    className="input"
                    value={award.issuer || ''}
                    onChange={(e) => onUpdate(award.id, { issuer: e.target.value })}
                    placeholder="e.g. TechCrunch / Stripe"
                  />
                </div>
              </div>

              <div className="grid-2-col">
                <div className="input-group">
                  <label><Calendar size={14} /> Award Date / Year</label>
                  <input
                    className="input"
                    value={award.date || ''}
                    onChange={(e) => onUpdate(award.id, { date: e.target.value })}
                    placeholder="e.g. May 2022"
                  />
                </div>
              </div>

              <div className="input-group">
                <label>Description (Optional)</label>
                <textarea
                  className="input"
                  rows={2}
                  value={award.description || ''}
                  onChange={(e) => onUpdate(award.id, { description: e.target.value })}
                  placeholder="Selected from 200+ competing international teams for best algorithmic trading prototype..."
                />
              </div>
            </div>
          ))}

          <button type="button" className="btn btn-secondary add-entry-btn" onClick={handleAddDefault}>
            <Plus size={16} /> Add Another Award
          </button>
        </div>
      )}
    </div>
  );
};
