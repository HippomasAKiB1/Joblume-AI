import { api } from './api';
import type {
  MasterProfile,
  MasterProfileUpdateRequest,
  ResumeViewSummary,
  ResumeViewDetail,
  ResumeViewCreateRequest,
  ResumeViewUpdateRequest,
} from '../types/v2';

/**
 * API V2 Client
 *
 * CRITICAL ARCHITECTURAL CONTRACT:
 * Reuses the existing axios instance from `./api` which contains the PR-3
 * automatic 401 token refresh interceptor, in-memory JWT authorization header,
 * and withCredentials cookie handling.
 *
 * DO NOT instantiate a new Axios client instance here.
 */

export const profileAPI = {
  /**
   * Fetch the user's canonical Master Profile.
   * Backend lazy-creates a default empty profile with all 10 canonical sections if absent.
   */
  getProfile: () => api.get<MasterProfile>('/api/v2/profile'),

  /**
   * Update fields in the user's Master Profile.
   * Automatic UUID minting is enforced on both client and server.
   */
  updateProfile: (data: MasterProfileUpdateRequest) =>
    api.put<MasterProfile>('/api/v2/profile', data),
};

export const resumeViewAPI = {
  /**
   * List all Resume Views belonging to the authenticated user.
   */
  list: () => api.get<ResumeViewSummary[]>('/api/v2/resumes'),

  /**
   * Create a new Resume View referencing Master Profile.
   */
  create: (data: ResumeViewCreateRequest) =>
    api.post<ResumeViewDetail>('/api/v2/resumes', data),

  /**
   * Fetch a single Resume View with its live resolved resume data.
   */
  get: (id: string) => api.get<ResumeViewDetail>(`/api/v2/resumes/${id}`),

  /**
   * Update view configuration (styling, ordering, visibility, entry selection).
   */
  update: (id: string, data: ResumeViewUpdateRequest) =>
    api.put<ResumeViewDetail>(`/api/v2/resumes/${id}`, data),

  /**
   * Delete a Resume View and cascade its versions.
   */
  delete: (id: string) => api.delete<{ message: string }>(`/api/v2/resumes/${id}`),

  /**
   * List all version snapshots for a Resume View.
   */
  versions: (id: string) =>
    api.get<import('../types/v2').ResumeVersionSummary[]>(`/api/v2/resumes/${id}/versions`),

  /**
   * Create a manual version snapshot for a Resume View.
   */
  createVersion: (id: string, data?: import('../types/v2').ResumeVersionCreateRequest) =>
    api.post<import('../types/v2').ResumeVersionDetail>(`/api/v2/resumes/${id}/versions`, data || {}),

  /**
   * Restore a previous version snapshot into active Resume View state.
   */
  restoreVersion: (id: string, versionId: string) =>
    api.post<import('../types/v2').ResumeRestoreResponse>(`/api/v2/resumes/${id}/versions/${versionId}/restore`),
};
