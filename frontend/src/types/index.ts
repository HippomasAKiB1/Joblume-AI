// ── User Types ─────────────────────────────────────────────
export interface User {
  id: string;
  full_name: string;
  email: string;
  subscription_tier: string;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

// ── Resume Types ───────────────────────────────────────────
export interface PersonalInfo {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  website: string;
  github: string;
  portfolio: string;
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
  gpa: string;
}

export interface Experience {
  id: string;
  title: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  bullets: string[];
}

export interface Project {
  id: string;
  name: string;
  description: string;
  technologies: string;
  link: string;
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  date: string;
  url: string;
}

export interface Language {
  id: string;
  name: string;
  level: string;
}

export interface Award {
  id: string;
  title: string;
  issuer: string;
  date: string;
  description: string;
}

export interface ResumeData {
  personalInfo: PersonalInfo;
  summary: string;
  education: Education[];
  experience: Experience[];
  projects: Project[];
  skills: string[];
  certifications: Certification[];
  languages: Language[];
  awards: Award[];
}

export interface Resume {
  id: string;
  user_id: string;
  title: string;
  template_name: string;
  json_data: ResumeData;
  created_at: string;
  updated_at: string;
}

// ── Cover Letter Types ─────────────────────────────────────
export interface CoverLetter {
  id: string;
  user_id: string;
  job_title: string | null;
  company_name: string | null;
  content: string;
  created_at: string;
}

// ── Application Types ──────────────────────────────────────
export type ApplicationStatus = 'Applied' | 'Interview' | 'Rejected' | 'Offer';

export interface Application {
  id: string;
  user_id: string;
  company: string;
  position: string;
  status: ApplicationStatus;
  applied_date: string;
  notes: string | null;
  created_at: string;
}

// ── AI Types ───────────────────────────────────────────────
export interface JobTailorResult {
  match_score: number;
  missing_keywords: string[];
  optimized_summary: string;
  improved_bullets: string[];
  suggested_skills: string[];
}

export interface ATSScoreResult {
  score: number;
  formatting_issues: string[];
  missing_keywords: string[];
  weak_verbs: string[];
  improvement_tips: string[];
}

// ── Template Types ─────────────────────────────────────────
export interface TemplateInfo {
  id: string;
  name: string;
  description: string;
  category: string;
  preview: string;
}

export const TEMPLATES: TemplateInfo[] = [
  { id: 'modern-professional', name: 'Modern Professional', description: 'Clean 2-column layout with accent sidebar', category: 'Professional', preview: '🎯' },
  { id: 'minimal-ats', name: 'Minimal ATS', description: 'Single column, maximum ATS compatibility', category: 'ATS-Friendly', preview: '📄' },
  { id: 'harvard-style', name: 'Harvard Style', description: 'Traditional academic format', category: 'Academic', preview: '🎓' },
  { id: 'europass', name: 'Europass', description: 'EU standard format for international jobs', category: 'International', preview: '🌍' },
  { id: 'creative-designer', name: 'Creative Designer', description: 'Bold colors and creative layout', category: 'Creative', preview: '🎨' },
  { id: 'academic-cv', name: 'Academic CV', description: 'Detailed publication-focused format', category: 'Academic', preview: '📚' },
  { id: 'executive-resume', name: 'Executive Resume', description: 'Executive summary focused, elegant', category: 'Executive', preview: '👔' },
];

export const DEFAULT_RESUME_DATA: ResumeData = {
  personalInfo: { fullName: '', email: '', phone: '', location: '', linkedin: '', website: '', github: '', portfolio: '' },
  summary: '',
  education: [],
  experience: [],
  projects: [],
  skills: [],
  certifications: [],
  languages: [],
  awards: [],
};
