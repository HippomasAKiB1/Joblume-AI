import { describe, it, expect } from 'vitest';
import { isConfigDirty } from '../dirty';
import type { LocalViewConfig } from '../../context/ResumeEditorContext';
import type { ResumeViewDetail } from '../../types/v2';

describe('Dirty State Detection Utility', () => {
  const baseServerView: ResumeViewDetail = {
    id: 'view-123',
    user_id: 'user-456',
    master_profile_id: 'master-789',
    title: 'Software Engineer 2026',
    template_id: 'minimal-ats',
    primary_color: '#111827',
    font_family: 'Inter',
    section_order: ['summary', 'experience', 'education'],
    section_visibility: { summary: true, experience: true, education: true },
    selected_entry_ids: { experience: ['exp-1', 'exp-2'] },
    content_overrides: {},
    resolved_data: {} as any,
    target_job_title: null,
    target_company: null,
    created_at: '2026-10-24T00:00:00Z',
    updated_at: '2026-10-24T00:00:00Z',
  };

  const matchingLocalConfig: LocalViewConfig = {
    title: 'Software Engineer 2026',
    template_id: 'minimal-ats',
    primary_color: '#111827',
    font_family: 'Inter',
    section_order: ['summary', 'experience', 'education'],
    section_visibility: { summary: true, experience: true, education: true },
    selected_entry_ids: { experience: ['exp-1', 'exp-2'] },
    content_overrides: {},
    target_job_title: null,
    target_company: null,
  };

  it('returns false when localConfig exactly matches server view', () => {
    expect(isConfigDirty(matchingLocalConfig, baseServerView)).toBe(false);
  });

  it('detects changes when title is modified', () => {
    const modified = { ...matchingLocalConfig, title: 'Lead Architect' };
    expect(isConfigDirty(modified, baseServerView)).toBe(true);
  });

  it('detects changes when template_id is switched', () => {
    const modified = { ...matchingLocalConfig, template_id: 'modern-professional' };
    expect(isConfigDirty(modified, baseServerView)).toBe(true);
  });

  it('detects changes when primary_color changes', () => {
    const modified = { ...matchingLocalConfig, primary_color: '#2563eb' };
    expect(isConfigDirty(modified, baseServerView)).toBe(true);
  });

  it('detects changes when section_order is reordered', () => {
    const modified = {
      ...matchingLocalConfig,
      section_order: ['experience', 'summary', 'education'],
    };
    expect(isConfigDirty(modified, baseServerView)).toBe(true);
  });

  it('detects changes when section_visibility is toggled', () => {
    const modified = {
      ...matchingLocalConfig,
      section_visibility: { summary: false, experience: true, education: true },
    };
    expect(isConfigDirty(modified, baseServerView)).toBe(true);
  });

  it('detects changes when selected_entry_ids is altered', () => {
    const modified = {
      ...matchingLocalConfig,
      selected_entry_ids: { experience: ['exp-1'] },
    };
    expect(isConfigDirty(modified, baseServerView)).toBe(true);
  });
});
