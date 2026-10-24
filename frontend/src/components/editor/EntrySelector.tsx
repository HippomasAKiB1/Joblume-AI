import React from 'react';
import type { MasterProfile } from '../../types/v2';
import { CheckSquare, Square, Briefcase, GraduationCap, FolderGit2, Award, Globe, Trophy, Layers } from 'lucide-react';

interface EntrySelectorProps {
  master: MasterProfile;
  selectedEntryIds: Record<string, string[]>;
  onChange: (updatedIds: Record<string, string[]>) => void;
}

export const EntrySelector: React.FC<EntrySelectorProps> = ({
  master,
  selectedEntryIds,
  onChange,
}) => {
  // If selectedEntryIds[sec] is undefined or null, by default ALL master entries are selected
  const isSelected = (section: string, id: string): boolean => {
    const list = selectedEntryIds[section];
    if (!list) return true; // default all included
    return list.includes(id);
  };

  const toggleItem = (section: string, id: string, allIds: string[]) => {
    const currentList = selectedEntryIds[section] ? [...selectedEntryIds[section]] : [...allIds];
    const exists = currentList.includes(id);
    const updated = exists ? currentList.filter((itemId) => itemId !== id) : [...currentList, id];
    onChange({
      ...selectedEntryIds,
      [section]: updated,
    });
  };

  const toggleAll = (section: string, allIds: string[]) => {
    const currentList = selectedEntryIds[section] ? [...selectedEntryIds[section]] : [...allIds];
    const allAreSelected = allIds.every((id) => currentList.includes(id));
    onChange({
      ...selectedEntryIds,
      [section]: allAreSelected ? [] : [...allIds],
    });
  };

  const renderSectionEntries = (
    sectionKey: string,
    sectionTitle: string,
    icon: React.ReactNode,
    items: Array<{ id: string; label: string; sub?: string }>
  ) => {
    if (items.length === 0) return null;
    const allIds = items.map((it) => it.id);
    const selectedCount = allIds.filter((id) => isSelected(sectionKey, id)).length;
    const allSelected = selectedCount === allIds.length;

    return (
      <div key={sectionKey} className="entry-section-block">
        <div className="entry-section-header">
          <div className="section-header-title">
            {icon}
            <span>{sectionTitle}</span>
            <span className="selection-count">
              ({selectedCount}/{items.length})
            </span>
          </div>
          <button
            type="button"
            className="btn-select-all"
            onClick={() => toggleAll(sectionKey, allIds)}
          >
            {allSelected ? 'Deselect All' : 'Select All'}
          </button>
        </div>

        <div className="entry-checkbox-list">
          {items.map((item) => {
            const checked = isSelected(sectionKey, item.id);
            return (
              <label key={item.id} className={`entry-checkbox-row ${checked ? 'is-selected' : ''}`}>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleItem(sectionKey, item.id, allIds)}
                />
                <div className="entry-checkbox-text">
                  <span className="entry-main-label">{item.label}</span>
                  {item.sub && <span className="entry-sub-label">{item.sub}</span>}
                </div>
              </label>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="entry-selector-container">
      <div className="entry-selector-intro">
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 16px 0' }}>
          Select which career entries from your Master Profile to include in this specific resume view.
        </p>
      </div>

      {renderSectionEntries(
        'experience',
        'Work Experience',
        <Briefcase size={15} className="sec-icon" />,
        master.experience.map((e) => ({
          id: e.id,
          label: e.title || 'Untitled Role',
          sub: e.company ? `at ${e.company}` : undefined,
        }))
      )}

      {renderSectionEntries(
        'education',
        'Education',
        <GraduationCap size={15} className="sec-icon" />,
        master.education.map((e) => ({
          id: e.id,
          label: e.institution || 'Untitled University',
          sub: e.degree || undefined,
        }))
      )}

      {renderSectionEntries(
        'projects',
        'Projects',
        <FolderGit2 size={15} className="sec-icon" />,
        master.projects.map((p) => ({
          id: p.id,
          label: p.name || 'Untitled Project',
          sub: p.technologies || undefined,
        }))
      )}

      {renderSectionEntries(
        'certifications',
        'Certifications',
        <Award size={15} className="sec-icon" />,
        master.certifications.map((c) => ({
          id: c.id,
          label: c.name || 'Untitled Certification',
          sub: c.issuer || undefined,
        }))
      )}

      {renderSectionEntries(
        'languages',
        'Languages',
        <Globe size={15} className="sec-icon" />,
        master.languages.map((l) => ({
          id: l.id,
          label: l.name || 'Language',
          sub: l.level || undefined,
        }))
      )}

      {renderSectionEntries(
        'awards',
        'Honors & Awards',
        <Trophy size={15} className="sec-icon" />,
        master.awards.map((a) => ({
          id: a.id,
          label: a.title || 'Untitled Award',
          sub: a.issuer || undefined,
        }))
      )}

      {master.custom_sections.map((sec) =>
        renderSectionEntries(
          `custom_${sec.id}`,
          sec.title || 'Custom Section',
          <Layers size={15} className="sec-icon" />,
          sec.items.map((it) => ({
            id: it.id,
            label: it.title || 'Item',
            sub: it.subtitle || undefined,
          }))
        )
      )}

      <style>{`
        .entry-selector-container {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .entry-section-block {
          background: var(--bg-primary, #ffffff);
          border: 1px solid var(--border-light, #e2e8f0);
          border-radius: var(--radius-md, 8px);
          overflow: hidden;
        }
        .entry-section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 14px;
          background: var(--bg-hover, #f8fafc);
          border-bottom: 1px solid var(--border-light, #e2e8f0);
        }
        .section-header-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 700;
          color: var(--text-primary, #0f172a);
        }
        .sec-icon {
          color: var(--primary, #4f46e5);
        }
        .selection-count {
          font-size: 11px;
          color: var(--text-tertiary, #64748b);
          font-weight: 500;
        }
        .btn-select-all {
          border: none;
          background: transparent;
          font-size: 11px;
          font-weight: 600;
          color: var(--primary, #4f46e5);
          cursor: pointer;
        }
        .btn-select-all:hover {
          text-decoration: underline;
        }
        .entry-checkbox-list {
          display: flex;
          flex-direction: column;
        }
        .entry-checkbox-row {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 14px;
          cursor: pointer;
          border-bottom: 1px solid var(--border-light, #f1f5f9);
          transition: background 0.1s ease;
        }
        .entry-checkbox-row:last-child {
          border-bottom: none;
        }
        .entry-checkbox-row:hover {
          background: var(--bg-hover, #f8fafc);
        }
        .entry-checkbox-row input {
          cursor: pointer;
        }
        .entry-checkbox-text {
          display: flex;
          flex-direction: column;
        }
        .entry-main-label {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-primary, #1e293b);
        }
        .entry-sub-label {
          font-size: 11px;
          color: var(--text-tertiary, #64748b);
        }
      `}</style>
    </div>
  );
};
