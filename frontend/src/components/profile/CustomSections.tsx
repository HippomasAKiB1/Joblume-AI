import React, { useState } from 'react';
import type { CustomSection, CustomSectionItem } from '../../types/v2';
import { Plus, Trash2, Layers, Calendar, ChevronDown } from 'lucide-react';

interface Props {
  sections: CustomSection[];
  onAddSection: (title: string) => void;
  onUpdateSection: (id: string, section: Partial<CustomSection>) => void;
  onRemoveSection: (id: string) => void;
  onAddItem: (sectionId: string, item: Partial<CustomSectionItem>) => void;
  onUpdateItem: (sectionId: string, itemId: string, item: Partial<CustomSectionItem>) => void;
  onRemoveItem: (sectionId: string, itemId: string) => void;
}

export const CustomSections: React.FC<Props> = ({
  sections,
  onAddSection,
  onUpdateSection,
  onRemoveSection,
  onAddItem,
  onUpdateItem,
  onRemoveItem,
}) => {
  const [newSectionTitle, setNewSectionTitle] = useState('');

  const handleCreateSection = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = newSectionTitle.trim();
    if (!cleanTitle) return;
    onAddSection(cleanTitle);
    setNewSectionTitle('');
  };

  const handleAddItemDefault = (sectionId: string) => {
    onAddItem(sectionId, {
      title: '',
      subtitle: '',
      date: '',
      description: '',
    });
  };

  return (
    <div className="profile-section-body">
      {/* Create new custom section bar */}
      <form onSubmit={handleCreateSection} className="custom-add-bar">
        <div className="input-group" style={{ flex: 1, marginBottom: 0 }}>
          <label><Layers size={14} /> New Custom Section Title</label>
          <input
            className="input"
            value={newSectionTitle}
            onChange={(e) => setNewSectionTitle(e.target.value)}
            placeholder="e.g. Volunteer Experience, Publications, Speaking, Patents"
          />
        </div>
        <button
          type="submit"
          className="btn btn-primary"
          style={{ height: 42, alignSelf: 'flex-end', whiteSpace: 'nowrap' }}
          disabled={!newSectionTitle.trim()}
        >
          <Plus size={16} /> Create Section
        </button>
      </form>

      {sections.length === 0 ? (
        <div className="empty-section-prompt" style={{ marginTop: '16px' }}>
          <Layers size={36} className="empty-icon" />
          <p className="empty-title">No custom sections defined</p>
          <p className="empty-desc">
            Need something not covered above? Add custom sections like Volunteer Work, Publications, or Key Speaking Engagements.
          </p>
        </div>
      ) : (
        <div className="custom-sections-list">
          {sections.map((sec) => (
            <div key={sec.id} className="custom-section-box card">
              <div className="custom-section-header">
                <div className="custom-title-edit">
                  <Layers size={18} className="custom-icon" />
                  <input
                    className="input custom-title-input"
                    value={sec.title || ''}
                    onChange={(e) => onUpdateSection(sec.id, { title: e.target.value })}
                    placeholder="Section Title"
                  />
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleAddItemDefault(sec.id)}
                  >
                    <Plus size={14} /> Add Item
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm delete-btn"
                    onClick={() => onRemoveSection(sec.id)}
                    title="Remove this section"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Items under this section */}
              <div className="custom-items-container">
                {sec.items.length === 0 ? (
                  <p className="empty-items-notice">No entries in this section yet. Click "Add Item" above.</p>
                ) : (
                  sec.items.map((item, idx) => (
                    <div key={item.id} className="custom-item-card">
                      <div className="grid-3-col">
                        <div className="input-group" style={{ marginBottom: 0 }}>
                          <label>Item Title / Role</label>
                          <input
                            className="input"
                            value={item.title || ''}
                            onChange={(e) =>
                              onUpdateItem(sec.id, item.id, { title: e.target.value })
                            }
                            placeholder="e.g. Lead Organizer"
                          />
                        </div>
                        <div className="input-group" style={{ marginBottom: 0 }}>
                          <label>Subtitle / Organization</label>
                          <input
                            className="input"
                            value={item.subtitle || ''}
                            onChange={(e) =>
                              onUpdateItem(sec.id, item.id, { subtitle: e.target.value })
                            }
                            placeholder="e.g. Open Source Initiative"
                          />
                        </div>
                        <div className="input-group" style={{ marginBottom: 0 }}>
                          <label><Calendar size={14} /> Date / Year</label>
                          <input
                            className="input"
                            value={item.date || ''}
                            onChange={(e) =>
                              onUpdateItem(sec.id, item.id, { date: e.target.value })
                            }
                            placeholder="e.g. 2022 - Present"
                          />
                        </div>
                      </div>

                      <div className="input-group" style={{ marginTop: '10px', marginBottom: 0 }}>
                        <label>Description (Optional)</label>
                        <textarea
                          className="input"
                          rows={2}
                          value={item.description || ''}
                          onChange={(e) =>
                            onUpdateItem(sec.id, item.id, { description: e.target.value })
                          }
                          placeholder="Key activities, publications, or outcomes..."
                        />
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm delete-btn"
                          onClick={() => onRemoveItem(sec.id, item.id)}
                          title="Remove item"
                        >
                          <Trash2 size={13} /> Remove Item
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        .custom-add-bar {
          display: flex;
          gap: 12px;
          align-items: flex-end;
          padding: 14px;
          background: var(--bg-elevated, #f8fafc);
          border: 1px dashed var(--border-light, #cbd5e1);
          border-radius: var(--radius-md, 8px);
          margin-bottom: 16px;
        }
        .custom-sections-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .custom-section-box {
          border: 1px solid var(--border-light, #e2e8f0);
          border-radius: var(--radius-md, 8px);
          padding: 16px;
        }
        .custom-section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 14px;
          gap: 12px;
        }
        .custom-title-edit {
          display: flex;
          align-items: center;
          gap: 10px;
          flex: 1;
        }
        .custom-icon {
          color: var(--primary, #4f46e5);
        }
        .custom-title-input {
          font-weight: 700;
          font-size: 16px;
          border-color: transparent;
          background: transparent;
          padding: 4px 8px;
        }
        .custom-title-input:focus {
          border-color: var(--primary, #4f46e5);
          background: var(--bg-primary, #ffffff);
        }
        .custom-items-container {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .custom-item-card {
          padding: 12px;
          background: var(--bg-elevated, #f8fafc);
          border: 1px solid var(--border-light, #cbd5e1);
          border-radius: var(--radius-md, 8px);
        }
        .empty-items-notice {
          font-size: 13px;
          color: var(--text-tertiary, #94a3b8);
          font-style: italic;
          margin: 4px 0;
        }
      `}</style>
    </div>
  );
};
