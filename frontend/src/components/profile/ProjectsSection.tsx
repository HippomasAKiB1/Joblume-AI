import React from 'react';
import type { ProjectItem } from '../../types/v2';
import { Plus, Trash2, FolderGit2, Link as LinkIcon, Code } from 'lucide-react';

interface Props {
  items: ProjectItem[];
  onAdd: (item: Partial<ProjectItem>) => void;
  onUpdate: (id: string, item: Partial<ProjectItem>) => void;
  onRemove: (id: string) => void;
}

export const ProjectsSection: React.FC<Props> = ({ items, onAdd, onUpdate, onRemove }) => {
  const handleAddDefault = () => {
    onAdd({
      name: '',
      description: '',
      technologies: '',
      link: '',
    });
  };

  return (
    <div className="profile-section-body">
      {items.length === 0 ? (
        <div className="empty-section-prompt">
          <FolderGit2 size={36} className="empty-icon" />
          <p className="empty-title">No projects added yet</p>
          <p className="empty-desc">
            Highlight notable open-source, personal, or commercial side projects.
          </p>
          <button type="button" className="btn btn-primary" onClick={handleAddDefault}>
            <Plus size={16} /> Add Project
          </button>
        </div>
      ) : (
        <div className="entries-list">
          {items.map((proj, index) => (
            <div key={proj.id} className="entry-card card">
              <div className="entry-header">
                <div className="entry-title-area">
                  <span className="entry-badge">#{index + 1}</span>
                  <h4 className="entry-title-text">{proj.name || 'Untitled Project'}</h4>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm delete-btn"
                  onClick={() => onRemove(proj.id)}
                  title="Remove project"
                >
                  <Trash2 size={14} /> Remove
                </button>
              </div>

              <div className="grid-2-col">
                <div className="input-group">
                  <label><FolderGit2 size={14} /> Project Name</label>
                  <input
                    className="input"
                    value={proj.name || ''}
                    onChange={(e) => onUpdate(proj.id, { name: e.target.value })}
                    placeholder="e.g. Real-Time Distributed Cache"
                  />
                </div>
                <div className="input-group">
                  <label><LinkIcon size={14} /> Project URL / Repository</label>
                  <input
                    className="input"
                    value={proj.link || ''}
                    onChange={(e) => onUpdate(proj.id, { link: e.target.value })}
                    placeholder="https://github.com/alexmorgan/cache-engine"
                  />
                </div>
              </div>

              <div className="input-group">
                <label><Code size={14} /> Technologies Used</label>
                <input
                  className="input"
                  value={proj.technologies || ''}
                  onChange={(e) => onUpdate(proj.id, { technologies: e.target.value })}
                  placeholder="e.g. Go, Redis, Docker, gRPC, Prometheus"
                />
              </div>

              <div className="input-group">
                <label>Description & Impact</label>
                <textarea
                  className="input"
                  rows={3}
                  value={proj.description || ''}
                  onChange={(e) => onUpdate(proj.id, { description: e.target.value })}
                  placeholder="Designed and benchmarked a high-throughput memory cache handling 100k requests/sec with p99 latency < 2ms..."
                />
              </div>
            </div>
          ))}

          <button type="button" className="btn btn-secondary add-entry-btn" onClick={handleAddDefault}>
            <Plus size={16} /> Add Another Project
          </button>
        </div>
      )}
    </div>
  );
};
