import type { LocalViewConfig } from '../context/ResumeEditorContext';
import type { ResumeViewDetail } from '../types/v2';

/**
 * Compares local configuration state against server persisted view state.
 * Returns true if any field has unsaved changes.
 */
export function isConfigDirty(local: LocalViewConfig, server: ResumeViewDetail | null): boolean {
  if (!server) return false;

  if (local.title.trim() !== (server.title || '').trim()) return true;
  if (local.template_id !== server.template_id) return true;
  if (local.primary_color.toLowerCase() !== (server.primary_color || '').toLowerCase()) return true;
  if (local.font_family !== server.font_family) return true;
  if ((local.target_job_title || '') !== (server.target_job_title || '')) return true;
  if ((local.target_company || '') !== (server.target_company || '')) return true;

  // Compare section order
  const serverOrder = server.section_order || [];
  if (local.section_order.length !== serverOrder.length) return true;
  for (let i = 0; i < local.section_order.length; i++) {
    if (local.section_order[i] !== serverOrder[i]) return true;
  }

  // Compare section visibility
  const serverVis = server.section_visibility || {};
  const localVisKeys = Object.keys(local.section_visibility);
  for (const key of localVisKeys) {
    const localVal = local.section_visibility[key] ?? true;
    const serverVal = serverVis[key] ?? true;
    if (localVal !== serverVal) return true;
  }

  // Compare selected entry IDs
  const serverEntries = server.selected_entry_ids || {};
  const allSectionKeys = Array.from(new Set([...Object.keys(local.selected_entry_ids), ...Object.keys(serverEntries)]));
  for (const secKey of allSectionKeys) {
    const localIds = local.selected_entry_ids[secKey] || [];
    const serverIds = serverEntries[secKey] || [];
    if (localIds.length !== serverIds.length) return true;
    const sortedLocal = [...localIds].sort();
    const sortedServer = [...serverIds].sort();
    for (let i = 0; i < sortedLocal.length; i++) {
      if (sortedLocal[i] !== sortedServer[i]) return true;
    }
  }

  return false;
}
