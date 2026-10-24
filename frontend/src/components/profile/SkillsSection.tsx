import React, { useState } from 'react';
import type { SkillItem } from '../../types/v2';
import { TagInput } from './TagInput';
import { parseTags } from '../../utils/normalize';
import { Plus, Trash2, Cpu, Tag, X } from 'lucide-react';

interface Props {
  skills: SkillItem[];
  onSetSkills: (skills: SkillItem[]) => void;
  onAddSkill: (skill: SkillItem) => void;
  onRemoveSkill: (name: string) => void;
}

export const SkillsSection: React.FC<Props> = ({ skills, onSetSkills, onAddSkill, onRemoveSkill }) => {
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillTags, setNewSkillTags] = useState('');

  const handleCreateSkill = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newSkillName.trim();
    if (!cleanName) return;

    const tags = parseTags(newSkillTags);
    onAddSkill({ name: cleanName, tags });
    setNewSkillName('');
    setNewSkillTags('');
  };

  const handleUpdateSkillTags = (skillName: string, updatedTags: string[]) => {
    const updated = skills.map((s) => (s.name === skillName ? { ...s, tags: updatedTags } : s));
    onSetSkills(updated);
  };

  return (
    <div className="profile-section-body">
      {/* Quick Add Form */}
      <form onSubmit={handleCreateSkill} className="skill-add-bar">
        <div className="grid-2-col" style={{ width: '100%', marginBottom: 0 }}>
          <div className="input-group" style={{ marginBottom: 0 }}>
            <label><Cpu size={14} /> Skill Name</label>
            <input
              className="input"
              value={newSkillName}
              onChange={(e) => setNewSkillName(e.target.value)}
              placeholder="e.g. React, PostgreSQL, System Design"
            />
          </div>
          <div className="input-group" style={{ marginBottom: 0 }}>
            <label><Tag size={14} /> Category Tags (Comma-separated)</label>
            <input
              className="input"
              value={newSkillTags}
              onChange={(e) => setNewSkillTags(e.target.value)}
              placeholder="e.g. frontend, backend, cloud"
            />
          </div>
        </div>
        <button
          type="submit"
          className="btn btn-primary"
          style={{ height: 42, alignSelf: 'flex-end', whiteSpace: 'nowrap' }}
          disabled={!newSkillName.trim()}
        >
          <Plus size={16} /> Add Skill
        </button>
      </form>

      {/* Skills Pill Cloud / List */}
      {skills.length === 0 ? (
        <div className="empty-section-prompt" style={{ marginTop: '16px' }}>
          <Cpu size={36} className="empty-icon" />
          <p className="empty-title">No skills added yet</p>
          <p className="empty-desc">
            Add your technical, domain, and soft skills with category tags to tailor resume views easily.
          </p>
        </div>
      ) : (
        <div className="skills-grid">
          {skills.map((skill) => (
            <div key={skill.name} className="skill-item-card">
              <div className="skill-top-row">
                <span className="skill-name-badge">{skill.name}</span>
                <button
                  type="button"
                  className="skill-remove-btn"
                  onClick={() => onRemoveSkill(skill.name)}
                  title={`Remove ${skill.name}`}
                >
                  <Trash2 size={13} />
                </button>
              </div>

              <div className="skill-tags-editor">
                <TagInput
                  tags={skill.tags || []}
                  onChange={(tags) => handleUpdateSkillTags(skill.name, tags)}
                  placeholder="+ tag (e.g. backend)"
                  size="sm"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        .skill-add-bar {
          display: flex;
          gap: 12px;
          align-items: flex-end;
          padding: 14px;
          background: var(--bg-elevated, #f8fafc);
          border: 1px dashed var(--border-light, #cbd5e1);
          border-radius: var(--radius-md, 8px);
          margin-bottom: 16px;
        }
        .skills-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 12px;
          margin-top: 12px;
        }
        .skill-item-card {
          padding: 10px 12px;
          background: var(--bg-primary, #ffffff);
          border: 1px solid var(--border-light, #e2e8f0);
          border-radius: var(--radius-md, 8px);
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .skill-top-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .skill-name-badge {
          font-weight: 600;
          font-size: 13px;
          color: var(--text-primary, #1e293b);
        }
        .skill-remove-btn {
          border: none;
          background: transparent;
          color: var(--text-tertiary, #94a3b8);
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          display: flex;
          align-items: center;
        }
        .skill-remove-btn:hover {
          color: var(--danger, #ef4444);
          background: rgba(239, 68, 68, 0.1);
        }
        .skill-tags-editor {
          width: 100%;
        }
      `}</style>
    </div>
  );
};
