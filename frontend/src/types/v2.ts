/**
 * TypeScript interfaces mirroring backend Pydantic schemas (Phase B.1 & B.2)
 * backend/app/schemas/schemas.py
 */

export interface PersonalInfo {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  website: string;
  linkedin: string;
  github: string;
  portfolio: string;
  photo_url?: string | null;
}

export interface SkillItem {
  name: string;
  tags: string[];
}

export interface BulletItem {
  id: string;
  text: string;
  tags: string[];
}

export interface ExperienceItem {
  id: string;
  title: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  bullets: BulletItem[];
}

export interface EducationItem {
  id: string;
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
  gpa: string;
}

export interface ProjectItem {
  id: string;
  name: string;
  description: string;
  technologies: string;
  link: string;
}

export interface CertificationItem {
  id: string;
  name: string;
  issuer: string;
  date: string;
  url: string;
}

export interface LanguageItem {
  id: string;
  name: string;
  level: string;
}

export interface AwardItem {
  id: string;
  title: string;
  issuer: string;
  date: string;
  description: string;
}

export interface CustomSectionItem {
  id: string;
  title: string;
  subtitle: string;
  date: string;
  description: string;
}

export interface CustomSection {
  id: string;
  title: string;
  items: CustomSectionItem[];
}

export interface MasterProfile {
  id: string;
  user_id: string;
  personal_info: PersonalInfo;
  summary: string;
  experience: ExperienceItem[];
  education: EducationItem[];
  projects: ProjectItem[];
  skills: SkillItem[];
  certifications: CertificationItem[];
  languages: LanguageItem[];
  awards: AwardItem[];
  custom_sections: CustomSection[];
  created_at: string;
  updated_at: string;
}

export type MasterProfileUpdateRequest = Partial<{
  personal_info: PersonalInfo;
  summary: string;
  experience: ExperienceItem[];
  education: EducationItem[];
  projects: ProjectItem[];
  skills: SkillItem[];
  certifications: CertificationItem[];
  languages: LanguageItem[];
  awards: AwardItem[];
  custom_sections: CustomSection[];
}>;

// ── V2 Resume View Types (Phase B.2) ───────────────────────────

export interface ResumeViewCreateRequest {
  title?: string;
  template_id?: string;
  master_profile_id?: string;
  primary_color?: string;
  font_family?: string;
  target_job_title?: string | null;
  target_company?: string | null;
}

export interface ResumeViewUpdateRequest {
  title?: string;
  template_id?: string;
  primary_color?: string;
  font_family?: string;
  section_order?: string[];
  section_visibility?: Record<string, boolean>;
  selected_entry_ids?: Record<string, string[]>;
  target_job_title?: string | null;
  target_company?: string | null;
}

export interface ResumeViewSummary {
  id: string;
  user_id: string;
  master_profile_id: string;
  title: string;
  template_id: string;
  primary_color: string;
  font_family: string;
  target_job_title?: string | null;
  target_company?: string | null;
  version_count?: number;
  created_at: string;
  updated_at: string;
}

export interface ResolvedResumeData {
  personal_info?: PersonalInfo;
  summary?: string;
  experience?: ExperienceItem[];
  education?: EducationItem[];
  projects?: ProjectItem[];
  skills?: SkillItem[];
  certifications?: CertificationItem[];
  languages?: LanguageItem[];
  awards?: AwardItem[];
  custom_sections?: CustomSection[];
  template_id: string;
  primary_color: string;
  font_family: string;
  section_order?: string[];
  section_visibility?: Record<string, boolean>;
}

export interface ResumeViewDetail {
  id: string;
  user_id: string;
  master_profile_id: string;
  title: string;
  template_id: string;
  primary_color: string;
  font_family: string;
  section_order: string[];
  section_visibility: Record<string, boolean>;
  selected_entry_ids: Record<string, string[]>;
  content_overrides: Record<string, any>;
  target_job_title?: string | null;
  target_company?: string | null;
  resolved_data: ResolvedResumeData;
  version_count?: number;
  created_at: string;
  updated_at: string;
}

export interface ResumeVersionSummary {
  id: string;
  resume_id: string;
  version_number: number;
  commit_message: string | null;
  created_at: string;
}

export interface ResumeVersionDetail {
  id: string;
  resume_id: string;
  version_number: number;
  commit_message: string | null;
  snapshot: Record<string, any>;
  created_at: string;
}

export interface ResumeVersionCreateRequest {
  commit_message?: string | null;
}

export interface ResumeRestoreResponse {
  message: string;
  resume_id: string;
  restored_version_number: number;
}
