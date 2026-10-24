import React from 'react';
import type { EducationItem } from '../../types/v2';
import { Plus, Trash2, GraduationCap, Building, Calendar, Award } from 'lucide-react';

interface Props {
  items: EducationItem[];
  onAdd: (item: Partial<EducationItem>) => void;
  onUpdate: (id: string, item: Partial<EducationItem>) => void;
  onRemove: (id: string) => void;
}

export const EducationSection: React.FC<Props> = ({ items, onAdd, onUpdate, onRemove }) => {
  const handleAddDefault = () => {
    onAdd({
      institution: '',
      degree: '',
      field: '',
      startDate: '',
      endDate: '',
      gpa: '',
    });
  };

  return (
    <div className="profile-section-body">
      {items.length === 0 ? (
        <div className="empty-section-prompt">
          <GraduationCap size={36} className="empty-icon" />
          <p className="empty-title">No education records added yet</p>
          <p className="empty-desc">
            Add your degrees, diplomas, or academic institutions.
          </p>
          <button type="button" className="btn btn-primary" onClick={handleAddDefault}>
            <Plus size={16} /> Add Education
          </button>
        </div>
      ) : (
        <div className="entries-list">
          {items.map((edu, index) => (
            <div key={edu.id} className="entry-card card">
              <div className="entry-header">
                <div className="entry-title-area">
                  <span className="entry-badge">#{index + 1}</span>
                  <h4 className="entry-title-text">{edu.institution || 'Untitled University / School'}</h4>
                  {edu.degree && <span className="entry-company-text">— {edu.degree}</span>}
                </div>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm delete-btn"
                  onClick={() => onRemove(edu.id)}
                  title="Remove education record"
                >
                  <Trash2 size={14} /> Remove
                </button>
              </div>

              <div className="grid-2-col">
                <div className="input-group">
                  <label><Building size={14} /> Institution / University</label>
                  <input
                    className="input"
                    value={edu.institution || ''}
                    onChange={(e) => onUpdate(edu.id, { institution: e.target.value })}
                    placeholder="e.g. University of California, Berkeley"
                  />
                </div>
                <div className="input-group">
                  <label><GraduationCap size={14} /> Degree</label>
                  <input
                    className="input"
                    value={edu.degree || ''}
                    onChange={(e) => onUpdate(edu.id, { degree: e.target.value })}
                    placeholder="e.g. Bachelor of Science"
                  />
                </div>
              </div>

              <div className="grid-3-col">
                <div className="input-group">
                  <label>Field of Study / Major</label>
                  <input
                    className="input"
                    value={edu.field || ''}
                    onChange={(e) => onUpdate(edu.id, { field: e.target.value })}
                    placeholder="e.g. Computer Science"
                  />
                </div>
                <div className="input-group">
                  <label><Calendar size={14} /> Start Date</label>
                  <input
                    className="input"
                    value={edu.startDate || ''}
                    onChange={(e) => onUpdate(edu.id, { startDate: e.target.value })}
                    placeholder="e.g. 2017"
                  />
                </div>
                <div className="input-group">
                  <label><Calendar size={14} /> End Date</label>
                  <input
                    className="input"
                    value={edu.endDate || ''}
                    onChange={(e) => onUpdate(edu.id, { endDate: e.target.value })}
                    placeholder="e.g. 2021"
                  />
                </div>
              </div>

              <div className="grid-2-col">
                <div className="input-group">
                  <label><Award size={14} /> GPA (Optional)</label>
                  <input
                    className="input"
                    value={edu.gpa || ''}
                    onChange={(e) => onUpdate(edu.id, { gpa: e.target.value })}
                    placeholder="e.g. 3.8 / 4.0"
                  />
                </div>
              </div>
            </div>
          ))}

          <button type="button" className="btn btn-secondary add-entry-btn" onClick={handleAddDefault}>
            <Plus size={16} /> Add Another Degree
          </button>
        </div>
      )}
    </div>
  );
};
