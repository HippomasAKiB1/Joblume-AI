import React from 'react';
import type { ExperienceItem, BulletItem } from '../../types/v2';
import { TagInput } from './TagInput';
import { generateUUID } from '../../utils/uuid';
import { Plus, Trash2, Briefcase, Calendar, MapPin, Building, ChevronDown } from 'lucide-react';

interface Props {
  items: ExperienceItem[];
  onAdd: (item: Partial<ExperienceItem>) => void;
  onUpdate: (id: string, item: Partial<ExperienceItem>) => void;
  onRemove: (id: string) => void;
}

export const ExperienceSection: React.FC<Props> = ({ items, onAdd, onUpdate, onRemove }) => {
  const handleAddDefault = () => {
    onAdd({
      title: '',
      company: '',
      location: '',
      startDate: '',
      endDate: '',
      current: false,
      bullets: [
        {
          id: generateUUID(),
          text: '',
          tags: [],
        },
      ],
    });
  };

  const handleAddBullet = (exp: ExperienceItem) => {
    const newBullet: BulletItem = {
      id: generateUUID(),
      text: '',
      tags: [],
    };
    onUpdate(exp.id, {
      bullets: [...exp.bullets, newBullet],
    });
  };

  const handleUpdateBulletText = (exp: ExperienceItem, bulletId: string, text: string) => {
    const updated = exp.bullets.map((b) => (b.id === bulletId ? { ...b, text } : b));
    onUpdate(exp.id, { bullets: updated });
  };

  const handleUpdateBulletTags = (exp: ExperienceItem, bulletId: string, tags: string[]) => {
    const updated = exp.bullets.map((b) => (b.id === bulletId ? { ...b, tags } : b));
    onUpdate(exp.id, { bullets: updated });
  };

  const handleRemoveBullet = (exp: ExperienceItem, bulletId: string) => {
    const updated = exp.bullets.filter((b) => b.id !== bulletId);
    onUpdate(exp.id, { bullets: updated });
  };

  return (
    <div className="profile-section-body">
      {items.length === 0 ? (
        <div className="empty-section-prompt">
          <Briefcase size={36} className="empty-icon" />
          <p className="empty-title">No experience entries recorded yet</p>
          <p className="empty-desc">
            Add full-time roles, internships, or freelance positions to your career repository.
          </p>
          <button type="button" className="btn btn-primary" onClick={handleAddDefault}>
            <Plus size={16} /> Add Experience
          </button>
        </div>
      ) : (
        <div className="entries-list">
          {items.map((exp, index) => (
            <div key={exp.id} className="entry-card card">
              <div className="entry-header">
                <div className="entry-title-area">
                  <span className="entry-badge">#{index + 1}</span>
                  <h4 className="entry-title-text">{exp.title || 'Untitled Position'}</h4>
                  {exp.company && <span className="entry-company-text">at {exp.company}</span>}
                </div>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm delete-btn"
                  onClick={() => onRemove(exp.id)}
                  title="Remove this role"
                >
                  <Trash2 size={14} /> Remove
                </button>
              </div>

              <div className="grid-2-col">
                <div className="input-group">
                  <label><Briefcase size={14} /> Job Title</label>
                  <input
                    className="input"
                    value={exp.title || ''}
                    onChange={(e) => onUpdate(exp.id, { title: e.target.value })}
                    placeholder="e.g. Lead Software Engineer"
                  />
                </div>
                <div className="input-group">
                  <label><Building size={14} /> Company / Organization</label>
                  <input
                    className="input"
                    value={exp.company || ''}
                    onChange={(e) => onUpdate(exp.id, { company: e.target.value })}
                    placeholder="e.g. Acme Corp"
                  />
                </div>
              </div>

              <div className="grid-3-col">
                <div className="input-group">
                  <label><MapPin size={14} /> Location</label>
                  <input
                    className="input"
                    value={exp.location || ''}
                    onChange={(e) => onUpdate(exp.id, { location: e.target.value })}
                    placeholder="e.g. Remote, or New York, NY"
                  />
                </div>
                <div className="input-group">
                  <label><Calendar size={14} /> Start Date</label>
                  <input
                    className="input"
                    value={exp.startDate || ''}
                    onChange={(e) => onUpdate(exp.id, { startDate: e.target.value })}
                    placeholder="e.g. Jan 2021"
                  />
                </div>
                <div className="input-group">
                  <label><Calendar size={14} /> End Date</label>
                  <input
                    className="input"
                    disabled={exp.current}
                    value={exp.current ? 'Present' : exp.endDate || ''}
                    onChange={(e) => onUpdate(exp.id, { endDate: e.target.value })}
                    placeholder={exp.current ? 'Present' : 'e.g. Present or Dec 2023'}
                  />
                  <label className="checkbox-label" style={{ marginTop: '6px' }}>
                    <input
                      type="checkbox"
                      checked={exp.current || false}
                      onChange={(e) =>
                        onUpdate(exp.id, {
                          current: e.target.checked,
                          endDate: e.target.checked ? 'Present' : '',
                        })
                      }
                    />
                    <span>Currently Working Here</span>
                  </label>
                </div>
              </div>

              {/* Bullets & Tags */}
              <div className="bullets-container">
                <div className="bullets-header">
                  <label className="bullets-label">Accomplishments & Key Bullets</label>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleAddBullet(exp)}
                  >
                    <Plus size={14} /> Add Bullet
                  </button>
                </div>

                {exp.bullets.map((bullet, bIdx) => (
                  <div key={bullet.id} className="bullet-row">
                    <div className="bullet-num">{bIdx + 1}.</div>
                    <div className="bullet-content">
                      <textarea
                        className="input bullet-input"
                        rows={2}
                        value={bullet.text || ''}
                        onChange={(e) => handleUpdateBulletText(exp, bullet.id, e.target.value)}
                        placeholder="Action verb + quantifiable achievement + result (e.g. Reduced latency by 42% by redesigning cache layer...)"
                      />
                      <div className="bullet-tags-row">
                        <span className="tags-label">Tags:</span>
                        <TagInput
                          tags={bullet.tags || []}
                          onChange={(newTags) => handleUpdateBulletTags(exp, bullet.id, newTags)}
                          placeholder="e.g. python, aws, latency"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      className="bullet-delete-btn"
                      onClick={() => handleRemoveBullet(exp, bullet.id)}
                      title="Delete bullet"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <button type="button" className="btn btn-secondary add-entry-btn" onClick={handleAddDefault}>
            <Plus size={16} /> Add Another Role
          </button>
        </div>
      )}
    </div>
  );
};
