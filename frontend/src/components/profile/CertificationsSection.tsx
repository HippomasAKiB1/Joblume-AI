import React from 'react';
import type { CertificationItem } from '../../types/v2';
import { Plus, Trash2, Award, Building, Calendar, Link as LinkIcon } from 'lucide-react';

interface Props {
  items: CertificationItem[];
  onAdd: (item: Partial<CertificationItem>) => void;
  onUpdate: (id: string, item: Partial<CertificationItem>) => void;
  onRemove: (id: string) => void;
}

export const CertificationsSection: React.FC<Props> = ({ items, onAdd, onUpdate, onRemove }) => {
  const handleAddDefault = () => {
    onAdd({
      name: '',
      issuer: '',
      date: '',
      url: '',
    });
  };

  return (
    <div className="profile-section-body">
      {items.length === 0 ? (
        <div className="empty-section-prompt">
          <Award size={36} className="empty-icon" />
          <p className="empty-title">No certifications added yet</p>
          <p className="empty-desc">
            Add your professional licenses, cloud credentials, or verified certificates.
          </p>
          <button type="button" className="btn btn-primary" onClick={handleAddDefault}>
            <Plus size={16} /> Add Certification
          </button>
        </div>
      ) : (
        <div className="entries-list">
          {items.map((cert, index) => (
            <div key={cert.id} className="entry-card card">
              <div className="entry-header">
                <div className="entry-title-area">
                  <span className="entry-badge">#{index + 1}</span>
                  <h4 className="entry-title-text">{cert.name || 'Untitled Certification'}</h4>
                  {cert.issuer && <span className="entry-company-text">by {cert.issuer}</span>}
                </div>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm delete-btn"
                  onClick={() => onRemove(cert.id)}
                  title="Remove certification"
                >
                  <Trash2 size={14} /> Remove
                </button>
              </div>

              <div className="grid-2-col">
                <div className="input-group">
                  <label><Award size={14} /> Certification Name</label>
                  <input
                    className="input"
                    value={cert.name || ''}
                    onChange={(e) => onUpdate(cert.id, { name: e.target.value })}
                    placeholder="e.g. AWS Certified Solutions Architect - Associate"
                  />
                </div>
                <div className="input-group">
                  <label><Building size={14} /> Issuing Organization</label>
                  <input
                    className="input"
                    value={cert.issuer || ''}
                    onChange={(e) => onUpdate(cert.id, { issuer: e.target.value })}
                    placeholder="e.g. Amazon Web Services"
                  />
                </div>
              </div>

              <div className="grid-2-col">
                <div className="input-group">
                  <label><Calendar size={14} /> Issue Date / Year</label>
                  <input
                    className="input"
                    value={cert.date || ''}
                    onChange={(e) => onUpdate(cert.id, { date: e.target.value })}
                    placeholder="e.g. Oct 2023"
                  />
                </div>
                <div className="input-group">
                  <label><LinkIcon size={14} /> Verification URL / Credential ID</label>
                  <input
                    className="input"
                    value={cert.url || ''}
                    onChange={(e) => onUpdate(cert.id, { url: e.target.value })}
                    placeholder="https://credly.com/badges/..."
                  />
                </div>
              </div>
            </div>
          ))}

          <button type="button" className="btn btn-secondary add-entry-btn" onClick={handleAddDefault}>
            <Plus size={16} /> Add Another Certification
          </button>
        </div>
      )}
    </div>
  );
};
